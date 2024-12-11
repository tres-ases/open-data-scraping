import {CfnOutput, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {StateMachine, StateMachineType, StringDefinitionBody} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import fs from "fs";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
  senadorQueue: Queue
  proyectoQueue: Queue
}

export default class SesionScraperSubStack extends NestedStack {
  readonly stateMachine: StateMachine;

  constructor(scope: Construct, id: string, {bucket, connection, senadorQueue, proyectoQueue}: Props) {
    super(scope, id);

    const sfRole = new Role(this, `${id}-role`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });

    bucket.grantReadWrite(sfRole);
    senadorQueue.grantSendMessages(sfRole);
    proyectoQueue.grantSendMessages(sfRole);

    const definition = fs.readFileSync('./lib/scraper/asl/sesion.asl.yaml', 'utf8');
    definition.replace(/__EVENTS_CONNECTION_ARN__/, connection.connectionArn);
    definition.replace(/__BUCKET_NAME__/, bucket.bucketName);
    definition.replace(/__SENADOR_QUEUE_URL__/, senadorQueue.queueUrl);
    definition.replace(/__PROYECTO_QUEUE_URL__/, proyectoQueue.queueUrl);

    this.stateMachine = new StateMachine(this, `${id}-sm`, {
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
    new CfnOutput(this, '__SENADOR_QUEUE_URL__', {
      value: senadorQueue.queueUrl,
    });
    new CfnOutput(this, '__PROYECTO_QUEUE_URL__', {
      value: proyectoQueue.queueUrl,
    });
  }
}
