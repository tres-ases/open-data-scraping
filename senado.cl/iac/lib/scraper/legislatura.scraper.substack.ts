import {CfnOutput, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
  sesionStateMachine: CfnStateMachine
}

export default class LegislaturaScraperSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, connection, sesionStateMachine}: Props) {
    super(scope, id);

    const sfRole = new Role(this, `${id}-role`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });

    bucket.grantReadWrite(sfRole);
    sfRole.addToPolicy(
      new PolicyStatement({
        actions: ['states:StartSyncExecution'],
        resources: [sesionStateMachine.attrArn]
      })
    );
    sfRole.attachInlinePolicy(
      new Policy(this, `${id}-EventBridgeRetrieveConnectionCredentialsScopedAccessPolicy`, {
        statements: [
          new PolicyStatement({
            sid: `${id}-ps-RetrieveConnectionCredentials`,
            effect: Effect.ALLOW,
            actions: ["events:RetrieveConnectionCredentials"],
            resources: [connection.connectionArn]
          }),
          new PolicyStatement({
            sid: `${id}-ps-GetAndDescribeSecretValue`,
            effect: Effect.ALLOW,
            actions: [
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret"
            ],
            resources: [connection.connectionSecretArn]
          })
        ]
      })
    );

    let definition = fs.readFileSync('./lib/scraper/asl/legislatura.asl.json', 'utf8');

    const sm = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: sfRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        bucket_name: bucket.bucketName,
        sesion_state_machine: sesionStateMachine.attrArn
      },
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.STANDARD,
      tracingConfiguration: {
        enabled: true
      },
    });
    sfRole.addToPolicy(
      new PolicyStatement({
        sid: `${id}-ps-InvokeHttpEndpoint1`,
        effect: Effect.ALLOW,
        actions: ["states:InvokeHTTPEndpoint"],
        resources: [sm.attrArn]
      })
    );


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
