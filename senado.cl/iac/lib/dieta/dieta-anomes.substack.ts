import {aws_lambda_nodejs as nodejs, CfnElement, Duration, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import {Construct} from "constructs";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {DefinitionBody, Parallel, StateMachine, StateMachineType, TaskInput} from "aws-cdk-lib/aws-stepfunctions";
import SenadoNodejsFunction from "../cdk/SenadoNodejsFunction";

interface Props extends NestedStackProps {
  bucket: Bucket
  commonsLy: LayerVersion
  scraperLy: LayerVersion
}

const prefix = 'dietaAnoMes';
const pckName = 'Dieta-AnoMes';

export default class DietaAnoMes extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const {bucket, commonsLy, scraperLy} = props;

    const saveJsonFn = new SenadoNodejsFunction(this, `${prefix}-saveJson`, {
      pckName,
      handler: 'dieta-anomes.saveAnosJsonStructured',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(saveJsonFn);

    const saveJsonLinesFn = new SenadoNodejsFunction(this, `${prefix}-saveJsonLines`, {
      pckName,
      handler: 'dieta-anomes.saveAnosJsonLines',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(saveJsonLinesFn);

    const getFn = new SenadoNodejsFunction(this, `${prefix}-get`, {
      pckName,
      handler: 'dieta-anomes.getAnosHandler',
      layers: [commonsLy, scraperLy],
      timeout: 90
    });

    const getJob = new LambdaInvoke(
      this,
      `${prefix}-get-job`, {
        lambdaFunction: getFn,
      }
    );

    const stateMachineDefinition = getJob
      .next(new Parallel(this, `${prefix}-save`)
        .branch(new LambdaInvoke(
          this,
          `${prefix}-saveJsonLines-job`, {
            lambdaFunction: saveJsonLinesFn,
            payload: TaskInput.fromJsonPathAt('$.Payload')
          }
        ))
        .branch(new LambdaInvoke(
          this,
          `${prefix}-saveJson-job`, {
            lambdaFunction: saveJsonFn,
            payload: TaskInput.fromJsonPathAt('$.Payload')
          }
        ))
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
