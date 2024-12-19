import {CfnOutput, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {CfnPipe} from "aws-cdk-lib/aws-pipes";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
  boletinQueue: Queue
}

export default class ProyectoScraperSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, connection, boletinQueue}: Props) {
    super(scope, id);

    const logGroup = new LogGroup(this, `${id}-smLogs`, {
      logGroupName: `/aws/vendedlogs/states/${id}-sm`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.THREE_MONTHS
    });

    const smRole = new Role(this, `${id}-smRole`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    const smRolePolicy = new Policy(this, 'smPolicy', {
      policyName: `${id}-smPolicy`,
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:Abort*',
            's3:DeleteObject*',
            's3:GetBucket*',
            's3:GetObject*',
            's3:List*',
            's3:PutObject',
            's3:PutObjectLegalHold',
            's3:PutObjectRetention',
            's3:PutObjectTagging',
            's3:PutObjectVersionTagging'
          ],
          resources: [
            bucket.bucketArn,
            `${bucket.bucketArn}/*`
          ]
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
          sid: 'InvokeHttpEndpoint',
          effect: Effect.ALLOW,
          actions: ["states:InvokeHTTPEndpoint"],
          resources: ['*']
        })
      ]
    });
    smRole.attachInlinePolicy(smRolePolicy);

    let definition = fs.readFileSync('./lib/scraper/asl/proyecto.asl.json', 'utf8');

    const sm = new CfnStateMachine(this, `${id}-sm`, {
      stateMachineName: `${id}-sm`,
      roleArn: smRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        bucket_name: bucket.bucketName
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
    boletinQueue.grantConsumeMessages(pipeRole);
    pipeRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["states:StartExecution"],
      resources: [sm.attrArn]
    }));

    new CfnPipe(this, `${id}-pipe`, {
      name: `${id}-pipe`,
      roleArn: pipeRole.roleArn,
      source: boletinQueue.queueArn,
      target: sm.attrArn,
      targetParameters: {
        stepFunctionStateMachineParameters: {
          invocationType: 'FIRE_AND_FORGET'
        },
      },
    });

    new CfnOutput(this, '${events_connection_arn}', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '${bucket_name}', {
      value: bucket.bucketName,
    });
  }
}
