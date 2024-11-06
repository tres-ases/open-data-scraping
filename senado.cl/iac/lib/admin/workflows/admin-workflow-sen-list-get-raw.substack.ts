import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

const prefix = 'senadoClWorkflows-senListExtractGetRaw';

interface AdminApiWorkflowsSubstackProps {
  layers: LayerVersion[]
  dataBucket: IBucket
  partMapDtlQueue: Queue
}

export default class AdminWorkflowSenListGetRawSubstack extends NestedStack {

  readonly queue: Queue;

  constructor(scope: Construct, {layers, dataBucket, partMapDtlQueue}: AdminApiWorkflowsSubstackProps) {
    super(scope, prefix);

    this.queue = new Queue(this, `${prefix}Queue`, {
      queueName: `${prefix}-queue`,
      visibilityTimeout: Duration.seconds(122),
      retentionPeriod: Duration.days(1),
      receiveMessageWaitTime: Duration.seconds(10),
      deliveryDelay: Duration.seconds(30),
    });

    const saveNuevosSenadoresFn = new ScraperFunction(this, `${prefix}Fn`, {
      pckName: 'Senadores',
      handler: 'senadores.handler.extractSaveRaw.handler',
      layers,
      timeout: 120,
      environment: {
        PART_MAP_DISTILL_QUEUE_URL: partMapDtlQueue.queueUrl
      }
    });

    partMapDtlQueue.grantSendMessages(saveNuevosSenadoresFn);
    dataBucket.grantReadWrite(saveNuevosSenadoresFn);
    saveNuevosSenadoresFn.addEventSource(new SqsEventSource(this.queue));
    this.queue.grantConsumeMessages(saveNuevosSenadoresFn);
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1]
      } catch (e) {
      }
    }
    return super.getLogicalId(element)
  }
}
