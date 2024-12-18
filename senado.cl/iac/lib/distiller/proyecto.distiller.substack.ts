import {NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket, EventType} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import SenadoFunction from "../commons/SenadoFunction";
import {Architecture, Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaDestination} from "aws-cdk-lib/aws-s3-notifications";

interface Props extends NestedStackProps {
  bucket: Bucket
}

export default class ProyectoDistillerSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket}: Props) {
    super(scope, id);

    const modelLy = new LayerVersion(this, `${id}-ModelLy`, {
      layerVersionName: `${id}-ModelLy`,
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../../../../artifact/model-layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const distillerLy = new LayerVersion(this, `${id}-DistillerLy`, {
      layerVersionName: `${id}-DistillerLy`,
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../../../../artifact/distiller-layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const xml2jsonLambda = new SenadoFunction(this, `${id}Fn`, {
      handler: 'proyectos-xml2json.handler',
      layers: [distillerLy, modelLy],
      timeout: 120,
    });
    bucket.grantReadWrite(xml2jsonLambda);
    bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(xml2jsonLambda),
      { prefix: 'raw/proyecto/'}
    );
  }
}
