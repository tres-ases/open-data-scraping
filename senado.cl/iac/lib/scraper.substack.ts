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
  constructor(scope: Construct, id: string, {bucket, parlamentarioImagenQueue, legislaturasTable, sesionesTable, parlamentariosTable, ...props}: Props) {
    super(scope, id, props);

    const parlamentarioQueue = new Queue(this, `${id}-parlamentario-queue`, {
      queueName: `${id}-parlamentario-queue`,
      visibilityTimeout: Duration.minutes(15),
    });

    const boletinQueue = new Queue(this, `${id}-proyecto-queue`, {
      queueName: `${id}-proyecto-queue`,
      visibilityTimeout: Duration.minutes(15),
    });

    const connection = new Connection(this, `${id}-connection`, {
      connectionName: `${id}-connection`,
      authorization: Authorization.apiKey('API-KEY', SecretValue.unsafePlainText('DUMMY'))
    });

    new LegislaturasScraperSubStack(this, `${id}-legislaturas`, {
      connection, legislaturasTable
    });

    const sesionSubStack = new SesionScraperSubStack(this, `${id}-sesion`, {
      connection, parlamentarioQueue, boletinQueue, sesionesTable
    });

    new LegislaturaSubStack(this, `${id}-legislatura`, {
      connection, legislaturasTable, sesionesTable,
      sesionStateMachine: sesionSubStack.stateMachine,
    });

    new ParlamentarioSubStack(this, `${id}-parlamentario`, {
      connection, parlamentarioQueue, parlamentarioImagenQueue, parlamentariosTable,
    });

    new ProyectoSubStack(this, `${id}-proyecto`, {
      bucket, connection, boletinQueue
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
      } catch (e) {

      }
    }
    return super.getLogicalId(element)
  }
}
