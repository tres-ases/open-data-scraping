import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack, NestedStackProps, SecretValue} from 'aws-cdk-lib';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Queue} from 'aws-cdk-lib/aws-sqs';
import {Authorization, Connection} from 'aws-cdk-lib/aws-events';
import SesionScraperSubStack from "./scraper/sesion.scraper.substack";
import LegislaturaSubStack from "./scraper/legislatura.scraper.substack";
import SenadorSubStack from "./scraper/senador.scraper.substack";
import ProyectoSubStack from "./scraper/proyecto.scraper.substack";
import LegislaturasScraperSubStack from "./scraper/legislaturas.scraper.substack";
import ModelScraperSubStack from "./scraper/model.scraper.substack";

interface Props extends NestedStackProps {
  bucket: Bucket
}

export default class ScraperSubstack extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const {bucket} = props;

    const senadorQueue = new Queue(this, `${id}-senador-queue`, {
      queueName: `${id}-senador-queue`,
      visibilityTimeout: Duration.hours(12),
    });

    const boletinQueue = new Queue(this, `${id}-proyecto-queue`, {
      queueName: `${id}-proyecto-queue`,
      visibilityTimeout: Duration.hours(12),
    });

    const connection = new Connection(this, `${id}-connection`, {
      connectionName: `${id}-connection`,
      authorization: Authorization.apiKey('API-KEY', SecretValue.unsafePlainText('DUMMY'))
    });

    //const rawModel = new ModelScraperSubStack(this, `${id}-model`);
//
    //new LegislaturasScraperSubStack(this, `${id}-legislaturas`, {
    //  connection, legislaturasTable: rawModel.legislaturas
    //});

    const sesionSubStack = new SesionScraperSubStack(this, `${id}-sesion`, {
      bucket, connection, senadorQueue, boletinQueue
    });

    new LegislaturaSubStack(this, `${id}-legislatura`, {
      bucket, connection, sesionStateMachine: sesionSubStack.stateMachine
    });

    new SenadorSubStack(this, `${id}-senador`, {
      bucket, connection, senadorQueue
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
