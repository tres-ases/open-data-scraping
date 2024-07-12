import {Duration, NestedStack, NestedStackProps,} from 'aws-cdk-lib';
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
    super(scope, id, {...props, parameters: {id}});
    const {bucket, commonsLy, scraperLy} = props;

    const getAnoMesParlIdArrayFn = new SenadoNodejsFunction(this, `${prefix}-getSaveList`, {
      pckName,
      handler: 'gastos-operacionales.getAnoMesParlIdArrayHandler',
      layers: [commonsLy, scraperLy]
    });

    const getSaveDataFn = new SenadoNodejsFunction(this, `${prefix}-anoMesArray`, {
      pckName,
      handler: 'gastos-operacionales.getSaveDataHandler',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(getSaveDataFn);

    const getAnoMesParlIdArrayJob = new LambdaInvoke(
      this,
      `${prefix}-anoMesParlIdArray-job`, {
        lambdaFunction: getAnoMesParlIdArrayFn,
      }
    );

    const stateMachineDefinition = getAnoMesParlIdArrayJob
      .next(
        new Map(this, `${prefix}-getSave-map`, {
          maxConcurrency: 12,
          itemsPath: JsonPath.stringAt('$.Payload')
        })
          .itemProcessor(new LambdaInvoke(
              this,
              `${prefix}-getSave-job`, {
                lambdaFunction: getSaveDataFn
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
}
