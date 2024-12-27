import {CfnElement, Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import ScraperSubstack from "./scraper.substack";
import DistillerSubstack from "./distiller.substack";
import {Queue} from "aws-cdk-lib/aws-sqs";
import TablesSubStack from "./main/tables.subStack";
import BuildTablesSubstack from "./build-tables.substack";
import {Table} from "aws-cdk-lib/aws-dynamodb";

export default class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, `${id}-bucket`, {
      bucketName: 'open-data-cl-bucket',
      removalPolicy: RemovalPolicy.RETAIN
    });

    const parlamentarioImagenQueue = new Queue(this, `${id}-parl-img-queue`, {
      queueName: `${id}-parl-img-queue`,
      visibilityTimeout: Duration.minutes(15),
    });

    const tables = new TablesSubStack(this, `${id}-model`);

    new ScraperSubstack(this, `${id}-scrap`, {
      bucket, parlamentarioImagenQueue,
      legislaturasTable: tables.legislaturas,
      sesionesTable: tables.sesiones,
      parlamentariosTable: tables.parlamentarios,
    });
    new DistillerSubstack(this, `${id}-dist`, {
      bucket, parlamentarioImagenQueue,
      proyectosTable: tables.proyectos
    });
    new BuildTablesSubstack(this, `${id}-bldTables`, {
      bucket,
      legislaturasTable: tables.legislaturas,
      sesionesTable: tables.sesiones,
      parlamentariosTable: tables.parlamentarios,
      proyectosTable: tables.proyectos,
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
