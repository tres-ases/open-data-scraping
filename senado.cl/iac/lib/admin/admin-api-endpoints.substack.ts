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

export default class AdminApiEndpointsSubstack extends NestedStack {

  readonly readS3Role: Role;
  readonly authorizer: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, {
    api,
    authorizer,
    layers,
    dataBucket,
    sesionesGetSaveWf
  }: AdminApiEndpointsSubstackProps) {
    super(scope, prefix);

    this.authorizer = authorizer;
    this.readS3Role = new Role(this, `${prefix}-readRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    this.readS3Role.addToPolicy(new PolicyStatement({
      resources: [dataBucket.bucketArn, `${dataBucket.bucketArn}/*`],
      actions: ['s3:GetObject', 's3:ListBucket']
    }));

    const rawResource = api.root.addResource('raw');
    const rawLegResource = rawResource.addResource('legislaturas');
    this.addS3Resource(rawLegResource, LegislaturasBucketKey.json);

    const rawLegIdResource = rawLegResource.addResource('{legId}');
    const rawLegIdSesResource = rawLegIdResource.addResource('sesiones');
    this.addS3Resource(rawLegIdSesResource, SesionesBucketKey.rawListJson('{legId}'), ['legId']);

    const rawSesResource = rawResource.addResource('sesiones');
    const rawSesIdResource = rawSesResource.addResource('{sesId}');
    this.addS3Resource(rawSesIdResource, SesionesBucketKey.rawDetalleJson('{sesId}'), ['sesId']);

    const rawSesIdAsiResource = rawSesIdResource.addResource('asistencia');
    this.addS3Resource(rawSesIdAsiResource, SesionesBucketKey.rawAsistenciaJson('{sesId}'), ['sesId']);

    const rawSesIdVotResource = rawSesIdResource.addResource('votaciones');
    this.addS3Resource(rawSesIdVotResource, SesionesBucketKey.rawVotacionJson('{sesId}'), ['sesId']);

    const rawSenResource = rawResource.addResource('senadores');
    const rawSenIdResource = rawSenResource.addResource('{senId}');
    this.addS3Resource(rawSenIdResource, SenadoresBucketKey.rawJson('{senId}'), ['senId'])

    const scraperResource = api.root.addResource('scraper');
    const scrSenadoresResource = scraperResource.addResource('senadores');
    const senadoresGetSaveFunction = new ScraperFunction(this, `${prefix}-senador-getSave`, {
      pckName: 'SenadoresGetSaveFunction',
      handler: 'senadores.getSaveHandler',
      layers
    });
    dataBucket.grantWrite(senadoresGetSaveFunction);

    scrSenadoresResource.addMethod("POST", new LambdaIntegration(senadoresGetSaveFunction, {
      proxy: false,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          "application/json": "$input.json('$.body')"
        }
      }]
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

    const scrLegislaturasResource = scraperResource.addResource('legislaturas');
    const legislaturasGetSaveFunction = new ScraperFunction(this, `${prefix}-legislaturas-getSave`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas.getSaveLegislaturasHandler',
      layers
    });
    dataBucket.grantWrite(legislaturasGetSaveFunction);

    scrLegislaturasResource.addMethod("POST", new LambdaIntegration(legislaturasGetSaveFunction, {
      proxy: false,
      passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          "application/json": "$input.json('$.body')"
        }
      }]
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

    const legislaturasGetFunction = new ScraperFunction(this, `${prefix}-legislaturas-get`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas.getLegislaturasHandler',
      layers
    });
    dataBucket.grantRead(legislaturasGetFunction);

    scrLegislaturasResource.addMethod('GET', new LambdaIntegration(legislaturasGetFunction, {
        proxy: false,
        passthroughBehavior: PassthroughBehavior.WHEN_NO_MATCH,
        integrationResponses: [{
          statusCode: '200'
        }]
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

    const sesionesGetSaveWfRole = new Role(this, `${prefix}-sesiones-getSave-wf-role`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    sesionesGetSaveWf.grantStartExecution(sesionesGetSaveWfRole);
    sesionesGetSaveWf.grantRead(sesionesGetSaveWfRole);

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
              stateMachineArn: sesionesGetSaveWf.stateMachineArn
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

  addS3Resource(resource: Resource, subpath: string, ids: string[] = []) {
    const propsRequestParameters: {[key: string]: string} = {
      'integration.request.header.Accept': 'method.request.header.Accept'
    };
    const optsRequestParameters: {[key: string]: boolean} = {
      'method.request.header.Accept': true
    };

    for(const id of ids) {
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
