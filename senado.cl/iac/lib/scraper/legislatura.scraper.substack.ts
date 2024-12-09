import {CfnOutput, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {CfnStateMachine, StateMachine, StateMachineType, StringDefinitionBody} from "aws-cdk-lib/aws-stepfunctions";
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

    let definition = fs.readFileSync('./lib/scraper/asl/legislatura.asl.json', 'utf8');

    new CfnStateMachine(this, `${id}-sm`, {
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
