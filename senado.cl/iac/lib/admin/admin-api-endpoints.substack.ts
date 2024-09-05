import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  Model,
  PassthroughBehavior,
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

const prefix = 'senado-cl-admin-api-endpoints';

interface AdminApiEndpointsSubstackProps {
  api: RestApi
  authorizer: CognitoUserPoolsAuthorizer
  layers: LayerVersion[]
  dataBucket: IBucket
  sesionesGetSaveWf: StateMachine
}

export default class AdminApiEndpointsSubstack extends NestedStack {

  constructor(scope: Construct, {
    api,
    authorizer,
    layers,
    dataBucket,
    sesionesGetSaveWf
  }: AdminApiEndpointsSubstackProps) {
    super(scope, prefix);

    const role = new Role(this, `${prefix}-readRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    role.addToPolicy(new PolicyStatement({
      resources: [dataBucket.bucketArn, `${dataBucket.bucketArn}/*`],
      actions: ['s3:GetObject', 's3:ListBucket']
    }));

    const rawResource = api.root.addResource('raw');
    const rawLegResource = rawResource.addResource('legislaturas');
    const rawLegIdResource = rawLegResource.addResource('{legId}');
    const rawLegIdSesResource = rawLegIdResource.addResource('sesiones');

    rawLegIdSesResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${SesionesBucketKey.rawListJson('{legId}')}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: role,
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
          requestParameters: {
            'integration.request.path.legId': 'method.request.path.legId',
            'integration.request.header.Accept': 'method.request.header.Accept'
          },
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
        authorizer: authorizer,
        requestParameters: {
          'method.request.path.legId': true,
          'method.request.header.Accept': true
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }]
      }
    );

    const rawSesResource = rawResource.addResource('sesiones');
    const rawSesIdResource = rawSesResource.addResource('{sesId}');

    rawSesIdResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${SesionesBucketKey.rawDetalleJson('{sesId}')}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: role,
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
          requestParameters: {
            'integration.request.path.sesId': 'method.request.path.sesId',
            'integration.request.header.Accept': 'method.request.header.Accept'
          },
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
        authorizer: authorizer,
        requestParameters: {
          'method.request.path.sesId': true,
          'method.request.header.Accept': true
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }]
      }
    );

    const rawSesIdAsiResource = rawSesIdResource.addResource('asistencia');

    rawSesIdAsiResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${SesionesBucketKey.rawAsistenciaJson('{sesId}')}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: role,
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
          requestParameters: {
            'integration.request.path.sesId': 'method.request.path.sesId',
            'integration.request.header.Accept': 'method.request.header.Accept'
          },
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
        authorizer: authorizer,
        requestParameters: {
          'method.request.path.sesId': true,
          'method.request.header.Accept': true
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }]
      }
    );

    const rawSesIdVotResource = rawSesIdResource.addResource('votaciones');
    rawSesIdVotResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${SesionesBucketKey.rawVotacionJson('{sesId}')}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: role,
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
          requestParameters: {
            'integration.request.path.sesId': 'method.request.path.sesId',
            'integration.request.header.Accept': 'method.request.header.Accept'
          },
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
        authorizer: authorizer,
        requestParameters: {
          'method.request.path.sesId': true,
          'method.request.header.Accept': true
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }]
      }
    );

    const legislaturasResource = api.root.addResource('legislaturas');

    legislaturasResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${LegislaturasBucketKey.json}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: role,
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
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
        authorizer: authorizer,
        requestParameters: {
          'method.request.header.Accept': true
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true
            }
          }]
      }
    );

    const legislaturasGetSaveFunction = new ScraperFunction(this, `${prefix}-legislaturas-getSave`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas.getSaveLegislaturasHandler',
      layers
    });
    dataBucket.grantWrite(legislaturasGetSaveFunction);

    legislaturasResource.addMethod("POST", new LambdaIntegration(legislaturasGetSaveFunction, {
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

    legislaturasResource
      .addResource('scraper')
      .addMethod('GET', new LambdaIntegration(legislaturasGetFunction, {
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

    const ejecucionesResource = api.root.addResource('ejecuciones');
    const ejeSesionesResource = ejecucionesResource.addResource('sesiones');

    ejeSesionesResource.addMethod('POST', new AwsIntegration({
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

    ejeSesionesResource.addResource('{exeId}')
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
