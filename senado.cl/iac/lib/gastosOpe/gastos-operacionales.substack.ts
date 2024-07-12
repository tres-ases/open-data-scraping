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

const prefix = 'gastosOpe';
const pckName = 'GastosOperacionales';

export default class GastosOperacionales extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const {bucket, commonsLy, scraperLy} = props;

    const getAnoMesArrayGroupsFn = new SenadoNodejsFunction(this, `${prefix}-getAnoMesArrayGroups`, {
      pckName,
      handler: 'gastos-operacionales.getAnoMesArrayGroupsHandler',
      layers: [commonsLy, scraperLy]
    });

    const getAnoMesParlIdArrayFn = new SenadoNodejsFunction(this, `${prefix}-getAnoMesParlIdArray`, {
      pckName,
      handler: 'gastos-operacionales.getAnoMesParlIdArrayHandler',
      layers: [commonsLy, scraperLy],
      timeout: 180
    });

    const getSaveDataFn = new SenadoNodejsFunction(this, `${prefix}-getSaveData`, {
      pckName,
      handler: 'gastos-operacionales.getSaveDataHandler',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(getSaveDataFn);

    const getAnoMesParlIdArrayJob = new LambdaInvoke(
      this,
      `${prefix}-anoMesParlIdArray-job`, {
        lambdaFunction: getAnoMesArrayGroupsFn,
      }
    );

    const stateMachineDefinition = getAnoMesParlIdArrayJob
      .next(
        new Map(this, `${prefix}-getAnoMesParlIdArray-map`, {
          maxConcurrency: 20,
          itemsPath: JsonPath.stringAt('$.Payload')
        })
          .itemProcessor(new LambdaInvoke(
              this,
              `${prefix}-getAnoMesParlIdArray-job`, {
                lambdaFunction: getAnoMesParlIdArrayFn,
                outputPath: JsonPath.stringAt('$.Payload')
              }
            ).next(new LambdaInvoke(
                this,
                `${prefix}-getSaveData-job`, {
                  lambdaFunction: getSaveDataFn
                }
              )
            )
          )
      );

    const stateMachine = new StateMachine(this, `${prefix}-sm`, {
      definitionBody: DefinitionBody.fromChainable(
        stateMachineDefinition
      ),
      stateMachineType: StateMachineType.STANDARD,
      timeout: Duration.minutes(20),
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
