import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import {
  RestApi,
  AwsIntegration,
  CognitoUserPoolsAuthorizer,
  AuthorizationType
} from "aws-cdk-lib/aws-apigateway";
import {
  UserPool,
  UserPoolClient,
  AccountRecovery
} from "aws-cdk-lib/aws-cognito";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

interface Props extends NestedStackProps {
  parlamentariosTable: Table;
}

export default class ApiSubStack extends NestedStack {
  readonly api: RestApi;

  constructor(scope: Construct, id: string, { parlamentariosTable, ...props }: Props) {
    super(scope, id, props);

    /* -------------------------------------------------------------------------
     * Cognito User Pool & Client
     * -----------------------------------------------------------------------*/
    const userPool = new UserPool(this, `${id}-userPool`, {
      userPoolName: `${id}-userPool`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
    });

    new UserPoolClient(this, `${id}-userPoolClient`, {
      userPool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    const authorizer = new CognitoUserPoolsAuthorizer(this, `${id}-authorizer`, {
      cognitoUserPools: [userPool],
    });

    /* -------------------------------------------------------------------------
     * IAM Role that API Gateway will assume to call DynamoDB
     * -----------------------------------------------------------------------*/
    const dynamoIntegrationRole = new Role(this, `${id}-dynamoRole`, {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });

    // Grant read (Scan) permissions on the target table
    parlamentariosTable.grantReadData(dynamoIntegrationRole);

    /* -------------------------------------------------------------------------
     * Rest API Definition
     * -----------------------------------------------------------------------*/
    this.api = new RestApi(this, `${id}-restApi`, {
      restApiName: `${id}-RestApi`,
    });

    const parlamentariosResource = this.api.root.addResource("parlamentarios");

    /* ----------------------- DynamoDB Scan Integration ----------------------*/
    const dynamoIntegration = new AwsIntegration({
      service: "dynamodb",
      action: "Scan",
      integrationHttpMethod: "POST",
      options: {
        credentialsRole: dynamoIntegrationRole,
        requestTemplates: {
          "application/json": JSON.stringify({
            TableName: parlamentariosTable.tableName,
          }),
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": "$input.json('$')",
            },
          },
        ],
      },
    });

    parlamentariosResource.addMethod("GET", dynamoIntegration, {
      authorizationType: AuthorizationType.COGNITO,
      authorizer,
      methodResponses: [
        {
          statusCode: '200',
        },
      ],
    });
  }
} 