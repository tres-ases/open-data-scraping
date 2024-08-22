import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  PassthroughBehavior,
  RestApi
} from "aws-cdk-lib/aws-apigateway";
import {PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {SenadoresBucketKey, SenadorFotoTipo} from "@senado-cl/global/senadores";
import {MainBucketKey} from "@senado-cl/global";

const prefix = 'senado-cl-admin-api-endpoints';

interface AdminApiEndpointsSubstackProps {
  api: RestApi
  authorizer: CognitoUserPoolsAuthorizer
}

export default class AdminApiEndpointsSubstack extends NestedStack {

  constructor(scope: Construct, {api, authorizer}: AdminApiEndpointsSubstackProps) {
    super(scope, prefix);

    const readRole = new Role(this, `${prefix}-readRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    readRole.addToPolicy(new PolicyStatement({
      resources: [`arn:aws:s3:::${MainBucketKey.S3_BUCKET}/*`],
      actions: ['s3:GetObject']
    }))

    const senadoresResource = api.root.addResource('senadores');

    senadoresResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${SenadoresBucketKey.periodoJsonStructured}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: readRole,
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

    senadoresResource.addResource('{id}')
    senadoresResource.addResource('image')
    senadoresResource.addResource('{tipo}')
      .addMethod('GET', new AwsIntegration({
          service: 's3',
          path: `${MainBucketKey.S3_BUCKET}/${SenadoresBucketKey.image('{id}', '{tipo}')}`,
          integrationHttpMethod: 'GET',
          options: {
            credentialsRole: readRole,
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            requestParameters: {
              'integration.request.path.id': 'method.request.path.id',
              'integration.request.path.tipo': 'method.request.path.tipo',
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
            'method.request.path.id': true,
            'method.request.path.tipo': true,
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
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
