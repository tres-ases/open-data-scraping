import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  environment: string;
  dataBucket: s3.Bucket;
  legislatorsTable: dynamodb.Table;
  sessionsTable: dynamodb.Table;
  analyticsTable: dynamodb.Table;
  votationsTable: dynamodb.Table;
  projectsTable: dynamodb.Table;
  expensesTable: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly apiGatewayUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { environment, dataBucket, legislatorsTable, sessionsTable, analyticsTable, votationsTable, projectsTable, expensesTable } = props;

    // Lambda execution role for API handlers
    const apiLambdaRole = new iam.Role(this, 'ApiLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DataAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:ListBucket',
              ],
              resources: [
                dataBucket.bucketArn,
                `${dataBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                legislatorsTable.tableArn,
                sessionsTable.tableArn,
                analyticsTable.tableArn,
                votationsTable.tableArn,
                projectsTable.tableArn,
                expensesTable.tableArn,
                `${legislatorsTable.tableArn}/index/*`,
                `${sessionsTable.tableArn}/index/*`,
                `${analyticsTable.tableArn}/index/*`,
                `${votationsTable.tableArn}/index/*`,
                `${projectsTable.tableArn}/index/*`,
                `${expensesTable.tableArn}/index/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/od/${environment}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Powertools layer - lookup ARN via AWS SSM Parameter Store
    const powertoolsLayerArn = ssm.StringParameter.valueForStringParameter(
      this,
      '/aws/service/powertools/typescript/generic/all/latest'
    );

    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      powertoolsLayerArn
    );

    // Legislators API Handler (placeholder)
    const legislatorsHandler = new lambda.Function(this, 'LegislatorsHandler', {
      functionName: `od-${environment}-legislators-api`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Legislators API placeholder', JSON.stringify(event, null, 2));
          return {
            success: true,
            data: {
              legislators: [],
              total: 0,
              page: 1
            }
          };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: apiLambdaRole,
      layers: [powertoolsLayer],
      loggingFormat: lambda.LoggingFormat.JSON,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'legislators-api',
        POWERTOOLS_METRICS_NAMESPACE: 'OD',
        LOG_LEVEL: 'INFO',
        DATA_BUCKET_NAME: dataBucket.bucketName,
        LEGISLATORS_TABLE_NAME: legislatorsTable.tableName,
        SESSIONS_TABLE_NAME: sessionsTable.tableName,
        ANALYTICS_TABLE_NAME: analyticsTable.tableName,
        VOTATIONS_TABLE_NAME: votationsTable.tableName,
        PROJECTS_TABLE_NAME: projectsTable.tableName,
        EXPENSES_TABLE_NAME: expensesTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Analytics API Handler (placeholder)
    const analyticsHandler = new lambda.Function(this, 'AnalyticsHandler', {
      functionName: `od-${environment}-analytics-api`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Analytics API placeholder', JSON.stringify(event, null, 2));
          return {
            success: true,
            data: {
              rankings: [],
              metrics: {}
            }
          };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      role: apiLambdaRole,
      layers: [powertoolsLayer],
      loggingFormat: lambda.LoggingFormat.JSON,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'analytics-api',
        POWERTOOLS_METRICS_NAMESPACE: 'OD',
        LOG_LEVEL: 'INFO',
        DATA_BUCKET_NAME: dataBucket.bucketName,
        LEGISLATORS_TABLE_NAME: legislatorsTable.tableName,
        SESSIONS_TABLE_NAME: sessionsTable.tableName,
        ANALYTICS_TABLE_NAME: analyticsTable.tableName,
        VOTATIONS_TABLE_NAME: votationsTable.tableName,
        PROJECTS_TABLE_NAME: projectsTable.tableName,
        EXPENSES_TABLE_NAME: expensesTable.tableName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // API Gateway
    this.apiGateway = new apigateway.RestApi(this, 'ODApi', {
      restApiName: `OD-${environment}-API`,
      description: 'Open Data API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      deployOptions: {
        stageName: environment,
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    // API Resources and Methods
    const apiV1 = this.apiGateway.root.addResource('api').addResource('v1');

    // Legislators endpoints
    const legislatorsResource = apiV1.addResource('legislators');

    // GET /api/v1/legislators
    const legislatorsIntegration = new apigateway.LambdaIntegration(legislatorsHandler, {
      proxy: false,
      requestTemplates: {
        'application/json': JSON.stringify({
          action: 'list',
          page: '$input.params(\'page\')',
          limit: '$input.params(\'limit\')',
          chamber: '$input.params(\'chamber\')',
          region: '$input.params(\'region\')',
        }),
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': '$input.path(\'$.data\')',
          },
        },
        {
          statusCode: '400',
          selectionPattern: '.*"success":false.*',
          responseTemplates: {
            'application/json': '{"error": "$input.path(\'$.error\')"}',
          },
        },
      ],
    });

    legislatorsResource.addMethod('GET', legislatorsIntegration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '400' },
      ],
    });

    // GET /api/v1/legislators/{id}
    const legislatorByIdResource = legislatorsResource.addResource('{id}');
    const legislatorByIdIntegration = new apigateway.LambdaIntegration(legislatorsHandler, {
      proxy: false,
      requestTemplates: {
        'application/json': JSON.stringify({
          action: 'get',
          legislatorId: '$input.params(\'id\')',
        }),
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': '$input.path(\'$.data\')',
          },
        },
        {
          statusCode: '404',
          selectionPattern: '.*"success":false.*',
          responseTemplates: {
            'application/json': '{"error": "$input.path(\'$.error\')"}',
          },
        },
      ],
    });

    legislatorByIdResource.addMethod('GET', legislatorByIdIntegration, {
      methodResponses: [
        { statusCode: '200' },
        { statusCode: '404' },
      ],
    });

    // Analytics endpoints
    const analyticsResource = apiV1.addResource('analytics');

    // GET /api/v1/analytics/rankings
    const rankingsResource = analyticsResource.addResource('rankings');
    const rankingsIntegration = new apigateway.LambdaIntegration(analyticsHandler, {
      proxy: false,
      requestTemplates: {
        'application/json': JSON.stringify({
          action: 'rankings',
          type: '$input.params(\'type\')',
          chamber: '$input.params(\'chamber\')',
          period: '$input.params(\'period\')',
        }),
      },
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': '$input.path(\'$.data\')',
          },
        },
      ],
    });

    rankingsResource.addMethod('GET', rankingsIntegration, {
      methodResponses: [
        { statusCode: '200' },
      ],
    });

    this.apiGatewayUrl = this.apiGateway.url;

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGatewayUrl,
      description: 'API Gateway URL',
      exportName: `OD-${environment}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.apiGateway.restApiId,
      description: 'API Gateway ID',
      exportName: `OD-${environment}-ApiGatewayId`,
    });
  }
}
