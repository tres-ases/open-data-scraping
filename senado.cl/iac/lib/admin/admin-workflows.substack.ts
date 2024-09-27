import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {DefinitionBody, JsonPath, StateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";

const prefix = 'senado-cl-workflows';

interface AdminApiWorkflowsSubstackProps {
  layers: LayerVersion[]
  dataBucket: IBucket
}

export default class AdminWorkflowsSubstack extends NestedStack {

  readonly sesionesGetSaveWf: StateMachine;

  constructor(scope: Construct, {layers, dataBucket}: AdminApiWorkflowsSubstackProps) {
    super(scope, prefix);

    const sesionesGetSaveFunction = new ScraperFunction(this, `${prefix}-sesiones-getSave`, {
      pckName: 'Sesiones',
      handler: 'sesiones.getSaveSesionesHandler',
      layers,
      timeout: 180
    });
    dataBucket.grantWrite(sesionesGetSaveFunction);

    const distillSaveLegislatura = new ScraperFunction(this, `${prefix}-legislatura-distill`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas.distillSaveLegislaturaHandler',
      layers,
      timeout: 180
    });
    dataBucket.grantReadWrite(sesionesGetSaveFunction);

    this.sesionesGetSaveWf = new StateMachine(this, `${prefix}-sesiones-getSave-Wf`, {
      definitionBody: DefinitionBody.fromChainable(
        new LambdaInvoke(this, `${prefix}-sesiones-getSave-step`, {
          lambdaFunction: sesionesGetSaveFunction,
          outputPath: JsonPath.stringAt("$.Payload")
        })
          .next(
            new LambdaInvoke(this, `${prefix}-legislatura-distill-step`, {
              lambdaFunction: distillSaveLegislatura,
              outputPath: JsonPath.stringAt("$.Payload")
            })
          )
      ),
      stateMachineType: StateMachineType.STANDARD,
      timeout: Duration.seconds(370),
      stateMachineName: `${prefix}-legislatura-sesiones-getSaveDistill-Wf`,
    })
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1]
      } catch (e) {
      }
    }
    return super.getLogicalId(element)
  }
}
