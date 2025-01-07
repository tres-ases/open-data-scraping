import {NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket, EventType} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import SenadoFunction from "../commons/SenadoFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {LambdaDestination} from "aws-cdk-lib/aws-s3-notifications";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  bucket: Bucket
  layers: LayerVersion[]
  proyectosTable: Table
}

export default class ProyectoDistillerSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, layers, proyectosTable}: Props) {
    super(scope, id);

    const lambda = new SenadoFunction(this, `${id}Fn`, {
      handler: 'proyectos-xml2json.handler',
      layers,
      timeout: 20,
      environment: {
        PROYECTOS_TABLE: proyectosTable.tableName,
      },
    });
    bucket.grantReadWrite(lambda);
    proyectosTable.grantReadWriteData(lambda);
    bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(lambda),
      { prefix: 'senado.cl/raw/proyecto/'}
    );
  }
}
