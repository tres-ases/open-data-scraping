import {CfnElement, CfnOutput, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {CfnPipe} from "aws-cdk-lib/aws-pipes";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  connection: Connection
  parlamentarioQueue: Queue
  parlamentarioImagenQueue: Queue
  parlamentariosTable: Table
}

export default class ParlamentarioScraperSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {
    connection, parlamentarioQueue, parlamentarioImagenQueue, parlamentariosTable
  }: Props) {
    super(scope, id);

    const logGroup = new LogGroup(this, `${id}-smLogs`, {
      logGroupName: `/aws/vendedlogs/states/${id}-sm`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.THREE_MONTHS
    });

    const smRole = new Role(this, `${id}-smRole`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    const smRolePolicy = new Policy(this, `${id}-smPolicy`, {
      policyName: `${id}-smPolicy`,
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'sqs:SendMessage',
            'sqs:SendMessageBatch',
          ],
          resources: [parlamentarioImagenQueue.queueArn]
        }),
        new PolicyStatement({
          sid: 'RetrieveConnectionCredentials',
          effect: Effect.ALLOW,
          actions: ["events:RetrieveConnectionCredentials"],
          resources: [connection.connectionArn]
        }),
        new PolicyStatement({
          sid: 'GetAndDescribeSecretValueForConnection',
          effect: Effect.ALLOW,
          actions: [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
          ],
          resources: [connection.connectionSecretArn]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogDelivery',
            'logs:CreateLogStream',
            'logs:GetLogDelivery',
            'logs:UpdateLogDelivery',
            'logs:DeleteLogDelivery',
            'logs:ListLogDeliveries',
            'logs:PutLogEvents',
            'logs:PutResourcePolicy',
            'logs:DescribeResourcePolicies',
            'logs:DescribeLogGroups'
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords',
            'xray:GetSamplingRules',
            'xray:GetSamplingTargets'
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
          ],
          resources: [parlamentariosTable.tableArn]
        }),
        new PolicyStatement({
          sid: 'InvokeHttpEndpoint',
          effect: Effect.ALLOW,
          actions: ["states:InvokeHTTPEndpoint"],
          resources: ['*']
        })
      ]
    });
    smRole.attachInlinePolicy(smRolePolicy);

    let definition = fs.readFileSync('./lib/scraper/asl/parlamentario.asl.json', 'utf8');

    const sm = new CfnStateMachine(this, `${id}-sm`, {
      stateMachineName: `${id}-sm`,
      roleArn: smRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        parlamentarios_table_name: parlamentariosTable.tableName,
        parlamentario_imagen_queue: parlamentarioImagenQueue.queueUrl,
      },
      stateMachineType: StateMachineType.EXPRESS,
      tracingConfiguration: {
        enabled: true
      },
      loggingConfiguration: {
        destinations: [{
          cloudWatchLogsLogGroup: {
            logGroupArn: logGroup.logGroupArn
          },
        }],
        includeExecutionData: true,
        level: 'ALL',
      }
    });

    const pipeRole = new Role(this, `${id}-pipeRole`, {
      roleName: `${id}-pipeRole`,
      assumedBy: new ServicePrincipal('pipes.amazonaws.com')
    });
    parlamentarioQueue.grantConsumeMessages(pipeRole);
    pipeRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'states:StartExecution',
        'states:StartSyncExecution'
      ],
      resources: [sm.attrArn]
    }));

    new CfnPipe(this, `${id}-pipe`, {
      name: `${id}-pipe`,
      roleArn: pipeRole.roleArn,
      source: parlamentarioQueue.queueArn,
      target: sm.attrArn,
      sourceParameters: {
        sqsQueueParameters: {
          batchSize: 1
        }
      },
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'REQUEST_RESPONSE'
        },
        inputTemplate: '{"Name": "slug-<$.body>", "Input": <$>}'
      },
    });

    new CfnOutput(this, '${events_connection_arn}', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '${parlamentarios_table_name}', {
      value: parlamentariosTable.tableName,
    });
    new CfnOutput(this, '${parlamentario_imagen_queue}', {
      value: parlamentarioImagenQueue.queueArn,
    });
  }
}
