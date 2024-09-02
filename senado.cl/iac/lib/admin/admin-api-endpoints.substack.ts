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
import {Bucket} from "aws-cdk-lib/aws-s3";

const prefix = 'senado-cl-admin-api-endpoints';

interface AdminApiEndpointsSubstackProps {
  api: RestApi
  authorizer: CognitoUserPoolsAuthorizer
  layers: LayerVersion[]
  dataBucket: Bucket
}

export default class AdminApiEndpointsSubstack extends NestedStack {

  constructor(scope: Construct, {api, authorizer, layers, dataBucket}: AdminApiEndpointsSubstackProps) {
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
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
