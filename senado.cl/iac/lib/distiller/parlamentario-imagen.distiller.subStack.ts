import {NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Queue} from "aws-cdk-lib/aws-sqs";
import SenadoFunction from "../commons/SenadoFunction";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

interface Props extends NestedStackProps {
  bucket: Bucket
  parlamentarioImagenQueue: Queue
  layers: LayerVersion[]
}

export default class ParlamentarioImagenDistillerSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, parlamentarioImagenQueue, layers}: Props) {
    super(scope, id);

    const lambda = new SenadoFunction(this, `${id}Fn`, {
      handler: 'parlamentarios-imgDownload.handler',
      layers,
      timeout: 10,
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    });
    lambda.addEventSource(
      new SqsEventSource(parlamentarioImagenQueue, {
        maxConcurrency: 10
      })
    );
    bucket.grantReadWrite(lambda);
    parlamentarioImagenQueue.grantConsumeMessages(lambda);
  }
}
