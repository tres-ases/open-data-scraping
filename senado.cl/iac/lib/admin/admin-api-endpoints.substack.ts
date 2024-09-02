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

    const role = new Role(this, `${prefix}-readRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    role.addToPolicy(new PolicyStatement({
      resources: [`arn:aws:s3:::${MainBucketKey.S3_BUCKET}`, `arn:aws:s3:::${MainBucketKey.S3_BUCKET}/*`],
      actions: ['s3:GetObject', 's3:ListBucket']
    }));

    const legislaturasResource = api.root.addResource('legislaturas');

    legislaturasResource.addMethod('GET', new AwsIntegration({
        service: 's3',
        path: `${MainBucketKey.S3_BUCKET}/${LegislaturasBucketKey.json}`,
        integrationHttpMethod: 'GET',
        options: {
          credentialsRole: role,
        }
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: authorizer,
      }
    );

    const legislaturasGetSaveFunction = new ScraperFunction(this, `${prefix}-legislaturas-getSave`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas.getSaveLegislaturasHandler',
      layers
    });

    legislaturasResource.addMethod("POST", new AwsIntegration({
      service: 'lambda',
      path: `2015-03-31/functions/${legislaturasGetSaveFunction.functionArn}/invocations`,
      integrationHttpMethod: 'POST',
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
    }));

    const legislaturasGetFunction = new ScraperFunction(this, `${prefix}-legislaturas-get`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas.getLegislaturasHandler',
      layers
    });

    legislaturasResource
      .addResource('scraper')
      .addMethod('GET', new AwsIntegration({
        service: 'lambda',
        path: `2015-03-31/functions/${legislaturasGetFunction.functionArn}/invocations`,
        integrationHttpMethod: 'POST',
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
      }));
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
