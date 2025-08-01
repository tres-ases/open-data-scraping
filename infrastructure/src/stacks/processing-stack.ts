import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface ProcessingStackProps extends cdk.StackProps {
  environment: string;
  dataBucket: s3.Bucket;
  legislatorsTable: dynamodb.Table;
  sessionsTable: dynamodb.Table;
  analyticsTable: dynamodb.Table;
  votationsTable: dynamodb.Table;
  projectsTable: dynamodb.Table;
  expensesTable: dynamodb.Table;
}

export class ProcessingStack extends cdk.Stack {
  public readonly extractionStateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: ProcessingStackProps) {
    super(scope, id, props);

    const { environment, dataBucket, legislatorsTable, sessionsTable, analyticsTable, votationsTable, projectsTable, expensesTable } = props;

    // Common Lambda execution role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
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
                's3:PutObject',
                's3:DeleteObject',
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
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
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
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/od/${environment}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
              ],
            }),
          ],
        }),
      },
    });

    // Common Lambda layer for shared dependencies
    // Remove the layer for now to avoid permission issues
    // We'll bundle the dependencies directly in the function
    // const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
    //   this,
    //   'PowertoolsLayer',
    //   `arn:aws:lambda:${this.region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:12`
    // );

    // Data Extractor Lambda (placeholder)
    const dataExtractorFunction = new lambda.Function(this, 'DataExtractorFunction', {
      functionName: `od-${environment}-data-extractor`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Data extraction placeholder', JSON.stringify(event, null, 2));
          return { success: true, message: 'Extraction completed' };
        };
      `),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      role: lambdaExecutionRole,
      // layers: [powertoolsLayer], // Removed to avoid permission issues
      loggingFormat: lambda.LoggingFormat.JSON,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'data-extractor',
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

    // Data Processor Lambda (placeholder)
    const dataProcessorFunction = new lambda.Function(this, 'DataProcessorFunction', {
      functionName: `od-${environment}-data-processor`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Data processing placeholder', JSON.stringify(event, null, 2));
          return { success: true, message: 'Processing completed' };
        };
      `),
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      role: lambdaExecutionRole,
      // layers: [powertoolsLayer], // Removed to avoid permission issues
      loggingFormat: lambda.LoggingFormat.JSON,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'data-processor',
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

    // Step Functions State Machine for data extraction workflow
    const extractionTask = new stepfunctionsTasks.LambdaInvoke(this, 'ExtractDataTask', {
      lambdaFunction: dataExtractorFunction,
      outputPath: '$.Payload',
    });

    const processingTask = new stepfunctionsTasks.LambdaInvoke(this, 'ProcessDataTask', {
      lambdaFunction: dataProcessorFunction,
      inputPath: '$',
      outputPath: '$.Payload',
    });

    const definition = extractionTask
      .next(processingTask);

    this.extractionStateMachine = new stepfunctions.StateMachine(this, 'ExtractionStateMachine', {
      stateMachineName: `OD-${environment}-DataExtraction`,
      definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.hours(2),
      tracingEnabled: true,
    });

    // EventBridge rule for scheduled extraction
    const dailyExtractionRule = new events.Rule(this, 'DailyExtractionRule', {
      ruleName: `OD-${environment}-DailyExtraction`,
      description: 'Trigger daily data extraction',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '6', // 6 AM UTC
        day: '*',
        month: '*',
        year: '*',
      }),
    });

    dailyExtractionRule.addTarget(new targets.SfnStateMachine(this.extractionStateMachine, {
      input: events.RuleTargetInput.fromObject({
        extractionType: 'daily',
        sources: ['senado', 'camara'],
      }),
    }));

    // Weekly extraction for SERVEL data
    const weeklyExtractionRule = new events.Rule(this, 'WeeklyExtractionRule', {
      ruleName: `OD-${environment}-WeeklyExtraction`,
      description: 'Trigger weekly SERVEL data extraction',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '7', // 7 AM UTC
        weekDay: 'SUN', // Sunday
      }),
    });

    weeklyExtractionRule.addTarget(new targets.SfnStateMachine(this.extractionStateMachine, {
      input: events.RuleTargetInput.fromObject({
        extractionType: 'weekly',
        sources: ['servel'],
      }),
    }));

    // Outputs
    new cdk.CfnOutput(this, 'ExtractionStateMachineArn', {
      value: this.extractionStateMachine.stateMachineArn,
      description: 'Step Functions State Machine for data extraction',
      exportName: `OD-${environment}-ExtractionStateMachineArn`,
    });

    new cdk.CfnOutput(this, 'DataExtractorFunctionArn', {
      value: dataExtractorFunction.functionArn,
      description: 'Lambda function for data extraction',
      exportName: `OD-${environment}-DataExtractorFunctionArn`,
    });
  }
}
