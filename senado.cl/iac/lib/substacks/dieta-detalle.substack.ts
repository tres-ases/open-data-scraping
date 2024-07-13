import {CfnElement, Duration, NestedStack, NestedStackProps,} from 'aws-cdk-lib';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from "constructs";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import SenadoNodejsFunction from "../cdk/SenadoNodejsFunction"
import {DefinitionBody, JsonPath, Map, StateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";

interface Props extends NestedStackProps {
  bucket: Bucket
  commonsLy: LayerVersion
  scraperLy: LayerVersion
}

const prefix = 'dietaDetalle';
const pckName = 'Dieta-Detalle';

export default class DietaDetalleSubstack extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const {bucket, commonsLy, scraperLy} = props;

    const getSaveList = new SenadoNodejsFunction(this, `${prefix}-getSaveList`, {
      pckName,
      handler: 'dieta-detalle.getSaveDietasHandler',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(getSaveList);

    const anoMesArrayFn = new SenadoNodejsFunction(this, `${prefix}-anoMesArray`, {
      pckName,
      handler: 'dieta-detalle.getSaveDietasHandler',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantRead(anoMesArrayFn);

    const anoMesArrayJob = new LambdaInvoke(
      this,
      `${prefix}-anoMesArray-job`, {
        lambdaFunction: anoMesArrayFn,
      }
    );

    const stateMachineDefinition = anoMesArrayJob
      .next(
        new Map(this, `${prefix}-getSave-map`, {
          maxConcurrency: 12,
          itemsPath: JsonPath.stringAt('$.Payload')
        })
          .itemProcessor(new LambdaInvoke(
              this,
              `${prefix}-getSave-job`, {
                lambdaFunction: getSaveList
              }
            )
          )
      );

    const stateMachine = new StateMachine(this, `${prefix}-sm`, {
      definitionBody: DefinitionBody.fromChainable(
        stateMachineDefinition
      ),
      stateMachineType: StateMachineType.STANDARD,
      timeout: Duration.minutes(5),
      stateMachineName: `${prefix}-sm`,
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
