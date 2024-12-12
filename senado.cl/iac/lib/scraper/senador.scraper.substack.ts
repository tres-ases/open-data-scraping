import {CfnOutput, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {CfnStateMachine, StateMachine, StateMachineType, StringDefinitionBody} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {CfnPipe} from "aws-cdk-lib/aws-pipes";
import {Queue} from "aws-cdk-lib/aws-sqs";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
  senadorQueue: Queue
}

export default class SenadorScraperSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, connection, senadorQueue}: Props) {
    super(scope, id);

    const sfRole = new Role(this, `${id}-smRole`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    bucket.grantReadWrite(sfRole);

    let definition = fs.readFileSync('./lib/scraper/asl/senador.asl.json', 'utf8');

    const sm = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: sfRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        bucket_name: bucket.bucketName
      },
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.EXPRESS,
      tracingConfiguration: {
        enabled: true
      },
    });
    sfRole.addToPolicy(
      new PolicyStatement({
        sid: 'InvokeHttpEndpoint',
        effect: Effect.ALLOW,
        actions: ["states:InvokeHTTPEndpoint"],
        resources: [sm.attrArn]
      })
    );

    const pipeRole = new Role(this, `${id}-pipeRole`, {
      roleName: `${id}-pipeRole`,
      assumedBy: new ServicePrincipal('pipes.amazonaws.com')
    });
    senadorQueue.grantConsumeMessages(pipeRole);
    pipeRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["states:StartExecution"],
      resources: [sm.attrArn]
    }));

    new CfnPipe(this, `${id}-pipe`, {
      name: `${id}-pipe`,
      roleArn: pipeRole.roleArn,
      source: senadorQueue.queueArn,
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
