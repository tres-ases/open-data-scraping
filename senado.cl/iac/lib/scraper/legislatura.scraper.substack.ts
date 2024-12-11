import {CfnOutput, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {StateMachine, StateMachineType, StringDefinitionBody} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
  sesionStateMachine: StateMachine
}

export default class LegislaturaScraperSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, connection, sesionStateMachine}: Props) {
    super(scope, id);

    const sfRole = new Role(this, `${id}-role`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });

    bucket.grantReadWrite(sfRole);
    sesionStateMachine.grantStartSyncExecution(sfRole);

    let definition = fs.readFileSync('./lib/scraper/asl/legislatura.asl.json', 'utf8');
    definition = definition.replace(/__EVENTS_CONNECTION_ARN__/, connection.connectionArn);
    definition = definition.replace(/__BUCKET_NAME__/, bucket.bucketName);
    definition = definition.replace(/__SESION_STATE_MACHINE__/, sesionStateMachine.stateMachineArn);

    const stateMachine = new StateMachine(this, `${id}-sm`, {
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.EXPRESS,
      definitionBody: StringDefinitionBody.fromString(definition)
    });

    new CfnOutput(this, '__EVENTS_CONNECTION_ARN__', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '__BUCKET_NAME__', {
      value: bucket.bucketName,
    });
    new CfnOutput(this, '__SESION_STATE_MACHINE__', {
      value: sesionStateMachine.stateMachineArn,
    });
  }
}
