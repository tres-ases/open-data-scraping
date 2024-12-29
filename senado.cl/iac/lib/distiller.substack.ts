import {CfnElement, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import ProyectoDistillerSubStack from "./distiller/proyecto.distiller.substack";
import {Architecture, Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import ParlamentarioImagenDistillerSubStack from "./distiller/parlamentario-imagen.distiller.subStack";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  bucket: Bucket
  parlamentarioImagenQueue: Queue
  proyectosTable: Table
}

export default class DistillerSubstack extends NestedStack {
  constructor(scope: Construct, id: string, {bucket, parlamentarioImagenQueue, proyectosTable, ...props}: Props) {
    super(scope, id, props);

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

    const distillerLy = new LayerVersion(this, `${id}-DistLy`, {
      layerVersionName: `${id}-DistillerLy`,
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../../../../artifact/distiller-layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const layers = [modelLy, distillerLy];

    new ProyectoDistillerSubStack(this, `${id}-proy`, {
      bucket, layers, proyectosTable
    });
    new ParlamentarioImagenDistillerSubStack(this,`${id}-parl-img`, {
      bucket, parlamentarioImagenQueue, layers,
    });
  }
}
