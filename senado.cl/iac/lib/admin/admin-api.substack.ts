import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import {UserPool, UserPoolEmail} from 'aws-cdk-lib/aws-cognito';
import {CognitoUserPoolsAuthorizer, RestApi} from "aws-cdk-lib/aws-apigateway";
import AdminApiEndpointsSubstack from "./admin-api-endpoints.substack";
import {Bucket} from "aws-cdk-lib/aws-s3";

const prefix = 'senado-cl-admin-api';

interface AdminApiSubstackProps {
  bucket: Bucket
  api: RestApi
}

export default class AdminApiSubstack extends NestedStack {
  constructor(scope: Construct, {bucket, api}: AdminApiSubstackProps) {
    super(scope, prefix);

    const userPool = new UserPool(this, `${prefix}-user-pool`, {
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

    const client = userPool.addClient(`${prefix}-user-pool-client`, {
      idTokenValidity: Duration.hours(8),
      accessTokenValidity: Duration.hours(8),
    });

    const authorizer = new CognitoUserPoolsAuthorizer(this, `${prefix}-authorizer`, {
      cognitoUserPools: [userPool]
    });

    const endpointsSubstack = new AdminApiEndpointsSubstack(this, {api: api, bucket, authorizer});
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
