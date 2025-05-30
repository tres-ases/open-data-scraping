import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack, NestedStackProps, SecretValue} from 'aws-cdk-lib';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Queue} from 'aws-cdk-lib/aws-sqs';
import {Authorization, Connection} from 'aws-cdk-lib/aws-events';
import SesionScraperSubStack from "./scraper/sesion.scraper.substack";
import LegislaturaSubStack from "./scraper/legislatura.scraper.substack";
import ParlamentarioSubStack from "./scraper/parlamentario.scraper.subStack";
import ProyectoSubStack from "./scraper/proyecto.scraper.substack";
import LegislaturasScraperSubStack from "./scraper/legislaturas.scraper.substack";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  bucket: Bucket
  parlamentarioImagenQueue: Queue
  legislaturasTable: Table
  sesionesTable: Table
  parlamentariosTable: Table
}

export default class ScraperSubstack extends NestedStack {
  constructor(scope: Construct, id: string, {
    bucket, parlamentarioImagenQueue, legislaturasTable, sesionesTable, parlamentariosTable, ...props
  }: Props) {
    super(scope, id, props);

    const parlamentarioQueue = new Queue(this, `${id}-parl-queue`, {
      queueName: `${id}-parl-queue.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: Duration.minutes(15),
    });

    const boletinQueue = new Queue(this, `${id}-proy-queue`, {
      queueName: `${id}-proy-queue.fifo`,
      fifo: true,
      contentBasedDeduplication: true,
      visibilityTimeout: Duration.minutes(15),
    });

    const connection = new Connection(this, `${id}-connection`, {
      connectionName: `${id}-connection`,
      authorization: Authorization.apiKey('API-KEY', SecretValue.unsafePlainText('DUMMY'))
    });

    new LegislaturasScraperSubStack(this, `${id}-legs`, {
      connection, legislaturasTable
    });

    const sesionSubStack = new SesionScraperSubStack(this, `${id}-ses`, {
      connection, parlamentarioQueue, boletinQueue, sesionesTable
    });

    new LegislaturaSubStack(this, `${id}-leg`, {
      connection, legislaturasTable, sesionesTable,
      sesionStateMachine: sesionSubStack.stateMachine,
    });

    new ParlamentarioSubStack(this, `${id}-parl`, {
      connection, parlamentarioQueue, parlamentarioImagenQueue, parlamentariosTable,
    });

    new ProyectoSubStack(this, `${id}-proy`, {
      bucket, connection, boletinQueue
    });
  }
}
