import {Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import ScraperSubstack from "./scraper.substack";
import DistillerSubstack from "./distiller.substack";
import {Queue} from "aws-cdk-lib/aws-sqs";

export default class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, `${id}-bucket`, {
      bucketName: 'open-data-cl-bucket',
      removalPolicy: RemovalPolicy.RETAIN
    });

    const parlamentarioImagenQueue = new Queue(this, `${id}-parlamentario-imagen-queue`, {
      queueName: `${id}-parlamentario-imagen.queue`,
      visibilityTimeout: Duration.minutes(15),
    });

    new ScraperSubstack(this, `${id}-scraper`, {bucket, parlamentarioImagenQueue});
    new DistillerSubstack(this, `${id}-distiller`, {bucket, parlamentarioImagenQueue});
  }
}
