import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import {UserPool, UserPoolClient, UserPoolEmail} from 'aws-cdk-lib/aws-cognito';
import {CognitoUserPoolsAuthorizer, Cors, Deployment, RestApi, Stage} from "aws-cdk-lib/aws-apigateway";
import AdminApiEndpointsSubstack from "./admin-api-endpoints.substack";
import {Bucket} from "aws-cdk-lib/aws-s3";

const prefix = 'senado-cl-admin-api';

interface AdminApiSubstackProps {
  bucket: Bucket
}

export default class AdminApiSubstack extends NestedStack {
  readonly userPool: UserPool;
  readonly client: UserPoolClient;
  readonly api: RestApi;

  constructor(scope: Construct, {bucket}: AdminApiSubstackProps) {
    super(scope, prefix);

    this.userPool = new UserPool(this, `${prefix}-user-pool`, {
      passwordPolicy: {
        requireUppercase: true,
        requireSymbols: true,
        requireDigits: true,
        minLength: 8,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      email: UserPoolEmail.withSES({
        sesRegion: 'us-east-1',
        fromEmail: 'no-responder@open-data.cl',
        fromName: 'Open Data Admin'
      })
    });

    this.client = this.userPool.addClient(`${prefix}-user-pool-client`, {
      idTokenValidity: Duration.hours(8),
      accessTokenValidity: Duration.hours(8),
    });

    this.api = new RestApi(this, `${prefix}-apigw`, {
      deploy: true,
      deployOptions: {
        stageName: 'api'
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'Access-Control-Allow-Credentials',
          'Access-Control-Allow-Headers',
          'Impersonating-User-Sub'
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: Cors.ALL_ORIGINS
      }
    });

    const authorizer = new CognitoUserPoolsAuthorizer(this, `${prefix}-authorizer`, {
      cognitoUserPools: [this.userPool]
    });

    const endpointsSubstack = new AdminApiEndpointsSubstack(this, {api: this.api, bucket, authorizer});
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
