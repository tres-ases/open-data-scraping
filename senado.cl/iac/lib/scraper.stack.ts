import {Construct} from "constructs";
import {CfnElement, Duration, RemovalPolicy, SecretValue, Stack, StackProps} from 'aws-cdk-lib';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Queue} from 'aws-cdk-lib/aws-sqs';
import {Authorization, Connection} from 'aws-cdk-lib/aws-events';
import SesionScraperSubStack from "./scraper/sesion.scraper.substack";
import LegislaturaScraperSubStack from "./scraper/legislatura.scraper.substack";
import SenadorScraperSubStack from "./scraper/senador.scraper.substack";

export default class ScraperStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, `${id}-bucket`, {
      bucketName: 'open-data-cl-bucket',
      removalPolicy: RemovalPolicy.DESTROY, // Cambiar a RETAIN en producción
      autoDeleteObjects: true,
    });

    const senadorQueue = new Queue(this, `${id}-senador-queue`, {
      queueName: `${id}-senador-queue`,
      visibilityTimeout: Duration.hours(12),
    });

    const proyectoQueue = new Queue(this, `${id}-proyecto-queue`, {
      queueName: `${id}-proyecto-queue`,
      visibilityTimeout: Duration.hours(12),
    });

    const connection = new Connection(this, `${id}-connection`, {
      connectionName: `${id}-connection`,
      authorization: Authorization.apiKey('API-KEY', SecretValue.unsafePlainText('DUMMY'))
    });

    const sesionSubStack = new SesionScraperSubStack(this, `${id}-sesion`, {
      bucket, connection, senadorQueue, proyectoQueue
    });

    new LegislaturaScraperSubStack(this, `${id}-legislatura`, {
      bucket, connection, sesionStateMachine: sesionSubStack.stateMachine
    });

    new SenadorScraperSubStack(this, `${id}-senador`, {
      bucket, connection, senadorQueue
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
