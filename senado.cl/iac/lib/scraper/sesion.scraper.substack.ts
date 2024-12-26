import {CfnElement, CfnOutput, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  connection: Connection
  parlamentarioQueue: Queue
  boletinQueue: Queue
  sesionesTable: Table
}

export default class SesionScraperSubStack extends NestedStack {
  readonly stateMachine: CfnStateMachine;

  constructor(scope: Construct, id: string, {connection, parlamentarioQueue, boletinQueue, sesionesTable}: Props) {
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
          resources: [parlamentarioQueue.queueArn, boletinQueue.queueArn]
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
          resources: [
            sesionesTable.tableArn
          ]
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

    const definition = fs.readFileSync('./lib/scraper/asl/sesion.asl.json', 'utf8');

    this.stateMachine = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: smRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        parlamentario_queue_url: parlamentarioQueue.queueUrl,
        boletin_queue_url: boletinQueue.queueUrl,
        sesiones_table_name: sesionesTable.tableName,
      },
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.EXPRESS,
      tracingConfiguration: {
        enabled: true
      },
      loggingConfiguration: {
        destinations: [{
          cloudWatchLogsLogGroup: {
            logGroupArn: logGroup.logGroupArn
          }
        }],
        includeExecutionData: true,
        level: 'ALL',
      }
    });

    new CfnOutput(this, '${events_connection_arn}', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '${parlamentario_queue_url}', {
      value: parlamentarioQueue.queueUrl,
    });
    new CfnOutput(this, '${proyecto_queue_url}', {
      value: boletinQueue.queueUrl,
    });
    new CfnOutput(this, '${sesiones_table_name}', {
      value: sesionesTable.tableName,
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
      } catch (e) {

      }
    }
    return super.getLogicalId(element)
  }
}
