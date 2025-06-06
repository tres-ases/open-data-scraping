import {Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import ScraperSubstack from "./scraper.substack";
import DistillerSubstack from "./distiller.substack";
import {Queue} from "aws-cdk-lib/aws-sqs";
import TablesSubStack from "./main/tables.subStack";
import BuildTablesSubstack from "./build-tables.substack";
import FrontStack from "./front.substack";
import ApiSubStack from "./api.substack";

export default class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, `${id}-bucket`, {
      bucketName: 'open-data-cl-bucket',
      removalPolicy: RemovalPolicy.RETAIN
    });

    const parlamentarioImagenQueue = new Queue(this, `${id}-parl-img-queue`, {
      fifo: true,
      queueName: `${id}-parl-img-queue.fifo`,
      visibilityTimeout: Duration.minutes(15),
      contentBasedDeduplication: true,
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
    new BuildTablesSubstack(this, `${id}-tables`, {
      bucket,
      legislaturasTable: tables.legislaturas,
      sesionesTable: tables.sesiones,
      parlamentariosTable: tables.parlamentarios,
      proyectosTable: tables.proyectos,
    });
    new FrontStack(this, `${id}-front`, props);
    new ApiSubStack(this, `${id}-api`, {
      parlamentariosTable: tables.parlamentarios,
    });
  }
}
