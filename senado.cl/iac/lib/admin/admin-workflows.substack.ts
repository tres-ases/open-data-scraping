import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {DefinitionBody, JsonPath, StateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";

const prefix = 'senado-cl-admin-workflows';

interface AdminApiWorkflowsSubstackProps {
  layers: LayerVersion[]
  dataBucket: IBucket
}

export default class AdminWorkflowsSubstack extends NestedStack {

  constructor(scope: Construct, {layers, dataBucket}: AdminApiWorkflowsSubstackProps) {
    super(scope, prefix);

    const sesionesGetSaveFunction = new ScraperFunction(this, `${prefix}-sesiones-getSave`, {
      pckName: 'Sesiones',
      handler: 'sesiones.getSaveSesionesHandler',
      layers,
      timeout: 180_000
    });
    dataBucket.grantWrite(sesionesGetSaveFunction);

    const sesionesGetSaveWf = new StateMachine(this, `${prefix}-sesiones-getSaveWf`, {
      definitionBody: DefinitionBody.fromChainable(
        new LambdaInvoke(this, `${prefix}-sesiones-getSave-step`, {
          lambdaFunction: sesionesGetSaveFunction,
          inputPath: JsonPath.stringAt("$.Body"),
          outputPath: JsonPath.stringAt("$.Payload")
        })
      ),
      stateMachineType: StateMachineType.STANDARD,
      timeout: Duration.seconds(190),
      stateMachineName: `${prefix}-sesiones-getSaveWf`,
    })
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1]
    }
    return super.getLogicalId(element)
  }
}
