import {CfnOutput, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
  sesionStateMachine: CfnStateMachine
  legislaturasTable: Table
  sesionesTable: Table
}

export default class LegislaturaScraperSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, connection, sesionStateMachine, legislaturasTable, sesionesTable}: Props) {
    super(scope, id);

    const logGroup = new LogGroup(this, `${id}-smLogs`, {
      logGroupName: `/aws/vendedlogs/states/${id}-sm`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.THREE_MONTHS
    });

    const smRole = new Role(this, `${id}-role`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    const smRolePolicy = new Policy(this, 'smPolicy', {
      policyName: `${id}-smPolicy`,
      statements: [
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
          actions: ['states:StartSyncExecution'],
          resources: [sesionStateMachine.attrArn]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogDelivery',
            'logs:GetLogDelivery',
            'logs:UpdateLogDelivery',
            'logs:DeleteLogDelivery',
            'logs:ListLogDeliveries',
            'logs:PutResourcePolicy',
            'logs:DescribeResourcePolicies',
            'logs:DescribeLogGroups'
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
            legislaturasTable.tableArn,
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

    let definition = fs.readFileSync('./lib/scraper/asl/legislatura.asl.json', 'utf8');

    const sm = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: smRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        bucket_name: bucket.bucketName,
        sesion_state_machine: sesionStateMachine.attrArn,
        legislaturas_table_name: legislaturasTable.tableName,
        sesiones_table_name: sesionesTable.tableName,
      },
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.STANDARD,
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

    new CfnOutput(this, '${events_connection_arn}', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '${bucket_name}', {
      value: bucket.bucketName,
    });
    new CfnOutput(this, '${sesion_state_machine}', {
      value: sesionStateMachine.attrArn,
    });
  }
}
