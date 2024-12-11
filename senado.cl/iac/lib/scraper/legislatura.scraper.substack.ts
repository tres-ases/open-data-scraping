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
        __EVENTS_CONNECTION_ARN__: connection.connectionArn,
        __BUCKET_NAME__: bucket.bucketName,
        __SESION_STATE_MACHINE__: sesionStateMachine.attrArn
      },
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.EXPRESS,
      tracingConfiguration: {
        enabled: true
      },
    });

    new CfnOutput(this, '__EVENTS_CONNECTION_ARN__', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '__BUCKET_NAME__', {
      value: bucket.bucketName,
    });
    new CfnOutput(this, '__SESION_STATE_MACHINE__', {
      value: sesionStateMachine.attrArn,
    });
  }
}
