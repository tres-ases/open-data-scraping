import {NestedStack, RemovalPolicy} from "aws-cdk-lib";
import {Construct} from "constructs";
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";

export default class TablesSubStack extends NestedStack {
  readonly legislaturas: Table;
  readonly sesiones: Table;
  readonly parlamentarios: Table;
  readonly proyectos: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.legislaturas = new Table(this, `${id}-legislaturas-dyn`, {
      tableName: 'senado-raw-legislaturas',
      partitionKey: {
        name: 'legId',
        type: AttributeType.NUMBER,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false
    });

    this.sesiones = new Table(this, `${id}-sesiones-dyn`, {
      tableName: 'senado-raw-sesiones',
      partitionKey: {
        name: 'legId',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'sesId',
        type: AttributeType.NUMBER,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false
    });

    this.parlamentarios = new Table(this, `${id}-parlamentarios-dyn`, {
      tableName: 'senado-raw-parlamentarios',
      partitionKey: {
        name: 'slug',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false
    });

    this.proyectos = new Table(this, `${id}-proyectos-dyn`, {
      tableName: 'senado-raw-proyectos',
      partitionKey: {
        name: 'boletin',
        type: AttributeType.NUMBER,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false
    });
  }
}
