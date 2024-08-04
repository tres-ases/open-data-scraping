import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import {UserPool, UserPoolClient, UserPoolEmail} from 'aws-cdk-lib/aws-cognito';
import {CfnAuthorizer, RestApi} from "aws-cdk-lib/aws-apigateway";
import AdminApiEndpointsSubstack from "./admin-api-endpoints.substack";

const prefix = 'senado-cl-admin-api';

export default class AdminApiSubstack extends NestedStack {
  readonly userPool: UserPool;
  readonly client: UserPoolClient;
  readonly api: RestApi;

  constructor(scope: Construct) {
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

    this.api = new RestApi(this, `${prefix}-apigw`, { deploy: false });

    const authorizer = new CfnAuthorizer(this, `${prefix}-authorizer`, {
      restApiId: this.api.restApiId,
      type: 'COGNITO_USER_POOLS',
      name: `${prefix}-authorizer`,
      providerArns: [this.userPool.userPoolArn], // userPoolArn is userPool.arn value
      identitySource: 'method.request.header.Authorization',
    });

    const endpointsSubstack = new AdminApiEndpointsSubstack(this, {api: this.api});
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
