import {CfnOutput, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {CfnStateMachine, StateMachine, StateMachineType, StringDefinitionBody} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {LogGroup} from "aws-cdk-lib/aws-logs";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
  senadorQueue: Queue
  proyectoQueue: Queue
}

export default class SesionScraperSubStack extends NestedStack {
  readonly stateMachine: CfnStateMachine;

  constructor(scope: Construct, id: string, {bucket, connection, senadorQueue, proyectoQueue}: Props) {
    super(scope, id);

    const sfRole = new Role(this, `${id}-role`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });

    bucket.grantReadWrite(sfRole);
    senadorQueue.grantSendMessages(sfRole);
    proyectoQueue.grantSendMessages(sfRole);

    const definition = fs.readFileSync('./lib/scraper/asl/sesion.asl.json', 'utf8');

    this.stateMachine = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: sfRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        bucket_name: bucket.bucketName,
        senador_queue_url: senadorQueue.queueUrl,
        proyecto_queue_url: proyectoQueue.queueUrl
      },
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.EXPRESS,
      tracingConfiguration: {
        enabled: true
      },
      loggingConfiguration: {
        destinations: [{
          cloudWatchLogsLogGroup: {
            logGroupArn: new LogGroup(this, `${id}-smLogs`, {
              logGroupName: `/aws/vendedlogs/states/${id}-sm`,
              removalPolicy: RemovalPolicy.DESTROY
            }).logGroupArn,
          },
        }],
        includeExecutionData: true,
        level: 'ALL',
      }
    });
    sfRole.addToPolicy(
      new PolicyStatement({
        sid: 'InvokeHttpEndpoint',
        effect: Effect.ALLOW,
        actions: ["states:InvokeHTTPEndpoint"],
        resources: [this.stateMachine.attrArn]
      })
    );

    new CfnOutput(this, '${events_connection_arn}', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '${bucket_name}', {
      value: bucket.bucketName,
    });
    new CfnOutput(this, '${senador_queue_url}', {
      value: senadorQueue.queueUrl,
    });
    new CfnOutput(this, '${proyecto_queue_url}', {
      value: proyectoQueue.queueUrl,
    });
  }
}
