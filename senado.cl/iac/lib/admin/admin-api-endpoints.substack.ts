import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  Model,
  PassthroughBehavior,
  RestApi, StepFunctionsIntegration
} from "aws-cdk-lib/aws-apigateway";
import {PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {MainBucketKey} from "@senado-cl/global";
import {LegislaturasBucketKey} from "@senado-cl/global/legislaturas";
import ScraperFunction from "../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {StateMachine} from "aws-cdk-lib/aws-stepfunctions";

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

    const legislaturaResource = legislaturasResource.addResource('{id}');

    const sesionesGetSaveWfRole = new Role(this, `${prefix}-sesiones-getSave-wf-role`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    sesionesGetSaveWf.grantStartSyncExecution(sesionesGetSaveWfRole);
    sesionesGetSaveWf.grantRead(sesionesGetSaveWfRole);

    const legSesResource = legislaturaResource.addResource('sesiones');

    const legSesExeResource = legSesResource.addResource('ejecucion');

    legSesExeResource.addMethod('POST', new AwsIntegration({
        service: 'states',
        action: 'StartSyncExecution',
        integrationHttpMethod: 'POST',
        options: {
          credentialsRole: sesionesGetSaveWfRole,
          integrationResponses: [
            {
              statusCode: '200',
              responseTemplates: {
                'application/json': "{ \"executionId\": \"$input.json('executionArn')\" }",
              },
            },
          ],
          requestTemplates: {
            'application/json': `
            {
                "input": "{ \"legId\": \"$input.params().path.get('id')\" }",
                "stateMachineArn": "${sesionesGetSaveWf.stateMachineArn}"
            }`,
          },
        },
      }),
      {
        methodResponses: [{statusCode: "200"}],
      }
    );

    legSesExeResource.addResource('{exeId}')
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
              'application/json': `
              {
                "executionArn": "$input.params().path.get('exeId')"
              }`,
            },
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
