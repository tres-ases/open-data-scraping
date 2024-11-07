import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

const prefix = 'senadoClWorkflows-PartMapDtl';

interface AdminWorkflowPartMapDtlSubstackProps {
  layers: LayerVersion[]
  dataBucket: IBucket
}

export default class AdminWorkflowPartMapDtlSubstack extends NestedStack {

  readonly queue: Queue;

  constructor(scope: Construct, {layers, dataBucket}: AdminWorkflowPartMapDtlSubstackProps) {
    super(scope, prefix);

    this.queue = new Queue(this, `${prefix}Queue`, {
      queueName: `${prefix}-distill-queue`,
      visibilityTimeout: Duration.seconds(122),
      retentionPeriod: Duration.days(1),
      receiveMessageWaitTime: Duration.seconds(10),
      deliveryDelay: Duration.seconds(30),
    });

    const distillPartidosFn = new ScraperFunction(this, `${prefix}Fn`, {
      pckName: 'Partidos',
      handler: 'partidos-distillMap.handler',
      layers,
      timeout: 120,
      reservedConcurrentExecutions: 1
    });

    dataBucket.grantReadWrite(distillPartidosFn);
    distillPartidosFn.addEventSource(new SqsEventSource(this.queue));
    this.queue.grantConsumeMessages(distillPartidosFn);
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
