import {NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket, EventType} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import SenadoFunction from "../commons/SenadoFunction";
import {Architecture, Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaDestination} from "aws-cdk-lib/aws-s3-notifications";

interface Props extends NestedStackProps {
  bucket: Bucket
  layers: LayerVersion[]
}

export default class ProyectoDistillerSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, layers}: Props) {
    super(scope, id);

    const xml2jsonLambda = new SenadoFunction(this, `${id}Fn`, {
      handler: 'proyectos-xml2json.handler',
      layers,
      timeout: 20,
    });
    bucket.grantReadWrite(xml2jsonLambda);
    bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(xml2jsonLambda),
      { prefix: 'raw/proyecto/'}
    );
  }
}
