import {NestedStack, RemovalPolicy} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";

export default class ModelScraperSubStack extends NestedStack {
  readonly legislaturas: Table;
  readonly sesiones: Table;
  readonly senadores: Table;
  readonly asistencia: Table;
  readonly votaciones: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.legislaturas = new Table(this, `${id}-legislaturas`, {
      tableName: 'senado-raw-legislaturas',
      partitionKey: {
        name: 'id',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'fechaModificacion',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.sesiones = new Table(this, `${id}-sesiones`, {
      tableName: 'senado-raw-sesiones',
      partitionKey: {
        name: 'id',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'fechaModificacion',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.senadores = new Table(this, `${id}-senadores`, {
      tableName: 'senado-raw-senadores',
      partitionKey: {
        name: 'slug',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'fechaModificacion',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.votaciones = new Table(this, `${id}-votaciones`, {
      tableName: 'senado-raw-votaciones',
      partitionKey: {
        name: 'sesId',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'fechaModificacion',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.asistencia = new Table(this, `${id}-asistencia`, {
      tableName: 'senado-raw-asistencia',
      partitionKey: {
        name: 'sesId',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'fechaModificacion',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
