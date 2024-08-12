import {CfnElement, Duration, NestedStack, NestedStackProps,} from 'aws-cdk-lib';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from "constructs";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import SenadoNodejsFunction from "../cdk/SenadoNodejsFunction"
import {DefinitionBody, JsonPath, Map, StateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";

interface Props extends NestedStackProps {
  bucket: Bucket
  layers: LayerVersion[]
}

const prefix = 'senadores';
const pckName = 'Senadores';

export default class SenadoresSubstack extends NestedStack {
  constructor(scope: Construct, props: Props) {
    super(scope, prefix, props);
    const {bucket, layers} = props;

    const getSaveSenadoresPeriodos = new SenadoNodejsFunction(this, `${prefix}-getSaveSenadoresPeriodos`, {
      pckName,
      handler: 'senadores.getSaveSenadoresPeriodosHandler',
      layers
    });
    bucket.grantWrite(getSaveSenadoresPeriodos);

    const getParlIdArray = new SenadoNodejsFunction(this, `${prefix}-getParlIdArray`, {
      pckName,
      handler: 'senadores.getParlIdArrayHandler',
      layers
    });
    bucket.grantRead(getParlIdArray);

    const getSaveDetails = new SenadoNodejsFunction(this, `${prefix}-getSaveDetails`, {
      pckName,
      handler: 'senadores.getSaveDetailsHandler',
      layers
    });
    bucket.grantWrite(getSaveDetails);

    const getParlIdArrayJob = new LambdaInvoke(
      this,
      `${prefix}-getParlIdArray-job`, {
        lambdaFunction: getParlIdArray,
      }
    );

    const stateMachineDefinition = getParlIdArrayJob
      .next(
        new Map(this, `${prefix}-getSaveDetails-map`, {
          maxConcurrency: 20,
          itemsPath: JsonPath.stringAt('$.Payload')
        })
          .itemProcessor(new LambdaInvoke(
              this,
              `${prefix}-getSaveDetails-job`, {
                lambdaFunction: getSaveDetails,
                outputPath: JsonPath.stringAt('$.Payload')
              }
            )
          )
      );

    const stateMachine = new StateMachine(this, `${prefix}-sm`, {
      definitionBody: DefinitionBody.fromChainable(
        stateMachineDefinition
      ),
      stateMachineType: StateMachineType.STANDARD,
      timeout: Duration.minutes(10),
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
