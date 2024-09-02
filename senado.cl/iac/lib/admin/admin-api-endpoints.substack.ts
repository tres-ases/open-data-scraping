import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {
  AuthorizationType,
  AwsIntegration,
  CognitoUserPoolsAuthorizer, LambdaIntegration,
  PassthroughBehavior,
  RestApi
} from "aws-cdk-lib/aws-apigateway";
import {PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {MainBucketKey} from "@senado-cl/global";
import {LegislaturasBucketKey} from "@senado-cl/global/legislaturas";
import ScraperFunction from "../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";

const prefix = 'senado-cl-admin-api-endpoints';

interface AdminApiEndpointsSubstackProps {
  api: RestApi
  authorizer: CognitoUserPoolsAuthorizer
  layers: LayerVersion[]
}

export default class AdminApiEndpointsSubstack extends NestedStack {

  constructor(scope: Construct, {api, authorizer, layers}: AdminApiEndpointsSubstackProps) {
    super(scope, prefix);

    const readRole = new Role(this, `${prefix}-readRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    readRole.addToPolicy(new PolicyStatement({
      resources: [`arn:aws:s3:::${MainBucketKey.S3_BUCKET}`, `arn:aws:s3:::${MainBucketKey.S3_BUCKET}/*`],
      actions: ['s3:GetObject', 's3:ListBucket']
    }))

    const legislaturasResource = api.root.addResource('legislaturas');

    legislaturasResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${LegislaturasBucketKey.json}`,
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

    legislaturasResource.addMethod("POST", new LambdaIntegration(
      new ScraperFunction(this, `${prefix}-legislaturas-getSave`, {
        pckName: 'Legislaturas',
        handler: 'legislaturas.getSaveLegislaturasHandler',
        layers
      })
    ));

    legislaturasResource
      .addResource('scraper')
      .addMethod('GET', new LambdaIntegration(
        new ScraperFunction(this, `${prefix}-legislaturas-get`, {
          pckName: 'Legislaturas',
          handler: 'legislaturas.getLegislaturasHandler',
          layers
        })
  ));
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
