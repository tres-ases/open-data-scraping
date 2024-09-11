import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  Model,
  PassthroughBehavior, Resource,
  RestApi
} from "aws-cdk-lib/aws-apigateway";
import {PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {MainBucketKey} from "@senado-cl/global";
import {LegislaturasBucketKey} from "@senado-cl/global/legislaturas";
import ScraperFunction from "../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {StateMachine} from "aws-cdk-lib/aws-stepfunctions";
import {SesionesBucketKey} from "@senado-cl/global/sesiones";
import {SenadoresBucketKey} from "@senado-cl/global/senadores";

const prefix = 'senado-cl-admin-api-endpoints';

interface AdminApiEndpointsSubstackProps {
  api: RestApi
  authorizer: CognitoUserPoolsAuthorizer
  layers: LayerVersion[]
  dataBucket: IBucket
  sesionesGetSaveWf: StateMachine
}

interface LambdaResurceProps {
  pckName: string
  handler: string
  grant: 'read' | 'write' | 'both'
}

interface MethodProps {
  httpMethod: string
  requestTemplate?: string
  responseTemplate?: string
}

export default class AdminApiEndpointsSubstack extends NestedStack {

  readonly api: RestApi;
  readonly layers: LayerVersion[];
  readonly readS3Role: Role;
  readonly authorizer: CognitoUserPoolsAuthorizer;
  readonly dataBucket: IBucket;
  readonly sesionesGetSaveWf: StateMachine;

  constructor(scope: Construct, {
    api,
    authorizer,
    layers,
    dataBucket,
    sesionesGetSaveWf
  }: AdminApiEndpointsSubstackProps) {
    super(scope, prefix);

    this.api = api;
    this.layers = layers;
    this.dataBucket = dataBucket;
    this.authorizer = authorizer;
    this.sesionesGetSaveWf = sesionesGetSaveWf;

    this.readS3Role = new Role(this, `${prefix}-readRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    this.readS3Role.addToPolicy(new PolicyStatement({
      resources: [dataBucket.bucketArn, `${dataBucket.bucketArn}/*`],
      actions: ['s3:GetObject', 's3:ListBucket']
    }));

    this.rawS3Api();
    this.dtlS3Api();
    this.scraperApi();

    const dtlrResource = api.root.addResource('distiller');
    const dtlrLegResource = dtlrResource.addResource('legislaturas');
    const dtlrLegIdResource = dtlrLegResource.addResource('{legId}');

    const legislaturaDistillFunction = new ScraperFunction(this, `${prefix}-legislaturas-get`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas.distillSaveLegislaturaHandler',
      layers
    });
    dataBucket.grantReadWrite(legislaturaDistillFunction);

    dtlrLegIdResource.addMethod('POST', new LambdaIntegration(legislaturaDistillFunction, {
      proxy: false,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      integrationResponses: [{
        statusCode: '200'
      }],
      requestTemplates: {
        'application/json': JSON.stringify({
          legId: '$input.params("legId")'
        }),
      }
    }), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: authorizer,
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            'application/json': Model.EMPTY_MODEL,
          },
        },
      ]
    });
  }

  rawS3Api() {
    const rawResource = this.api.root.addResource('raw');
    const rawLegResource = rawResource.addResource('legislaturas');
    this.addS3ToResource(rawLegResource, LegislaturasBucketKey.rawJson);

    const rawLegIdResource = rawLegResource.addResource('{legId}');
    const rawLegIdSesResource = rawLegIdResource.addResource('sesiones');
    this.addS3ToResource(rawLegIdSesResource, SesionesBucketKey.rawListJson('{legId}'), ['legId']);

    const rawSesResource = rawResource.addResource('sesiones');
    const rawSesIdResource = rawSesResource.addResource('{sesId}');
    this.addS3ToResource(rawSesIdResource, SesionesBucketKey.rawDetalleJson('{sesId}'), ['sesId']);

    const rawSesIdAsiResource = rawSesIdResource.addResource('asistencia');
    this.addS3ToResource(rawSesIdAsiResource, SesionesBucketKey.rawAsistenciaJson('{sesId}'), ['sesId']);

    const rawSesIdVotResource = rawSesIdResource.addResource('votaciones');
    this.addS3ToResource(rawSesIdVotResource, SesionesBucketKey.rawVotacionJson('{sesId}'), ['sesId']);

    const rawSenResource = rawResource.addResource('senadores');
    const rawSenIdResource = rawSenResource.addResource('{senId}');
    this.addS3ToResource(rawSenIdResource, SenadoresBucketKey.rawJson('{senId}'), ['senId'])
  }

  dtlS3Api() {
    const dtlResource = this.api.root.addResource('dtl');
    const dtlLegResource = dtlResource.addResource('legislaturas');
    this.addS3ToResource(dtlLegResource, LegislaturasBucketKey.distilledJson);
    const dtlLegIdResource = dtlLegResource.addResource('{legId}');
    this.addS3ToResource(dtlLegIdResource, LegislaturasBucketKey.distilledDetailJson('{legId}'), ['legId']);
  }

  scraperApi() {
    const layers = this.layers;

    const scraperResource = this.api.root.addResource('scraper');
    const scrSenadoresResource = scraperResource.addResource('senadores');
    const scrSenSlugResource = scrSenadoresResource.addResource('{slug}');

    this.addLambdaToResource(scrSenSlugResource, 'senador-getSave', {
      pckName: 'Senadores',
      handler: 'senadores.getSaveHandler',
      grant: 'write'
    }, {
      httpMethod: 'POST',
      responseTemplate: "$input.json('$.body')",
    });

    const scrLegislaturasResource = scraperResource.addResource('legislaturas');
    this.addLambdaToResource(scrLegislaturasResource, 'legislaturas-getSave', {
      pckName: 'Legislaturas',
      handler: 'legislaturas.getSaveLegislaturasHandler',
      grant: 'write'
    }, {
      httpMethod: 'POST',
      responseTemplate: "$input.json('$.body')",
    });

    this.addLambdaToResource(scrLegislaturasResource, 'legislaturas-get', {
      pckName: 'Legislaturas',
      handler: 'legislaturas.getLegislaturasHandler',
      grant: 'read'
    }, {
      httpMethod: 'GET',
      requestTemplate: JSON.stringify({
        slug: '$input.params("ownerId")'
      }),
    });

    const sesionesGetSaveWfRole = new Role(this, `${prefix}-sesiones-getSave-wf-role`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    this.sesionesGetSaveWf.grantStartExecution(sesionesGetSaveWfRole);
    this.sesionesGetSaveWf.grantRead(sesionesGetSaveWfRole);

    const scrSesionesResource = scraperResource.addResource('sesiones');

    scrSesionesResource.addMethod('POST', new AwsIntegration({
        service: 'states',
        action: 'StartExecution',
        options: {
          credentialsRole: sesionesGetSaveWfRole,
          integrationResponses: [
            {
              statusCode: '200',
              responseTemplates: {
                'application/json': `{ "executionId": $input.json('executionArn') }`
              },
            },
          ],
          requestTemplates: {
            'application/json': JSON.stringify({
              input: `{ "legId": "$input.params('legId')" }`,
              stateMachineArn: this.sesionesGetSaveWf.stateMachineArn
            }),
          },
        },
      }),
      {
        methodResponses: [{statusCode: "200"}],
      }
    );

    scrSesionesResource.addResource('{exeId}')
      .addMethod('GET', new AwsIntegration({
          service: 'states',
          action: 'DescribeExecution',
          integrationHttpMethod: 'POST',
          options: {
            credentialsRole: sesionesGetSaveWfRole,
            integrationResponses: [
              {
                statusCode: '200',
                responseTemplates: {
                  'application/json': `
                    #set ($status = $input.json('status'))
                    {
                    #if($status == '"SUCCEEDED"')
                      "output": $util.parseJson($input.json('output')),
                    #end
                      "status": $status
                    }
                  `,
                },
              },
            ],
            requestTemplates: {
              'application/json': JSON.stringify({
                "executionArn": "$input.params().path.get('exeId')"
              })
            }
          },
        }),
        {
          methodResponses: [{statusCode: "200"}],
        }
      );
  }

  addLambdaToResource(resource: Resource, suffix: string, {pckName, handler, grant}: LambdaResurceProps, {httpMethod, requestTemplate, responseTemplate}: MethodProps) {
    const lambda = new ScraperFunction(this, `${prefix}-${suffix}-lambda`, {
      pckName, handler, layers: this.layers
    });
    if(grant === 'read')
      this.dataBucket.grantRead(lambda);
    else if(grant === 'write')
      this.dataBucket.grantWrite(lambda);
    else
      this.dataBucket.grantReadWrite(lambda);

    resource.addMethod(httpMethod, new LambdaIntegration(lambda, {
      proxy: false,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: responseTemplate ? {
          'application/json': responseTemplate
        } : undefined
      }],
      requestTemplates: requestTemplate ? {
        'application/json': requestTemplate,
      } : undefined
    }), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: this.authorizer,
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            'application/json': Model.EMPTY_MODEL,
          },
        },
      ]
    });
  }

  addS3ToResource(resource: Resource, subpath: string, ids: string[] = []) {
    const propsRequestParameters: { [key: string]: string } = {
      'integration.request.header.Accept': 'method.request.header.Accept'
    };
    const optsRequestParameters: { [key: string]: boolean } = {
      'method.request.header.Accept': true
    };

    for (const id of ids) {
      propsRequestParameters[`integration.request.path.${id}`] = `method.request.path.${id}`;
      optsRequestParameters[`method.request.path.${id}`] = true;
    }

    resource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${subpath}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: this.readS3Role,
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
          requestParameters: propsRequestParameters,
          integrationResponses: [{
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': 'integration.response.header.Content-Type'
            }
          }]
        }
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: this.authorizer,
        requestParameters: optsRequestParameters,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }]
      }
    );
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1]
      } catch (e) {
      }
    }
    return super.getLogicalId(element)
  }
}
