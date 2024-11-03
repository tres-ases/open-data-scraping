import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

const prefix = 'senadoClWorkflows-proMapDtl';

interface AdminWorkflowProyMapDtlSubstackProps {
  layers: LayerVersion[]
  dataBucket: IBucket
}

export default class AdminWorkflowProyMapDtlSubstack extends NestedStack {

  readonly queue: Queue;

  constructor(scope: Construct, {layers, dataBucket}: AdminWorkflowProyMapDtlSubstackProps) {
    super(scope, prefix);

    this.queue = new Queue(this, `${prefix}-distillProyecto-queue`, {
      queueName: `${prefix}-distillProyecto-queue`,
      visibilityTimeout: Duration.seconds(122),
      retentionPeriod: Duration.days(1),
      receiveMessageWaitTime: Duration.seconds(10),
      deliveryDelay: Duration.seconds(30),
    });

    const distillProyectoFn = new ScraperFunction(this, `${prefix}-distillProyecto`, {
      pckName: 'Proyectos',
      handler: 'proyectos.distill',
      layers,
      timeout: 120
    });

    dataBucket.grantReadWrite(distillProyectoFn);
    distillProyectoFn.addEventSource(new SqsEventSource(this.queue));
    this.queue.grantConsumeMessages(distillProyectoFn);
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
