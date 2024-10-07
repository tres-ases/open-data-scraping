import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {DefinitionBody, JsonPath, StateMachine, StateMachineType, TaskInput} from "aws-cdk-lib/aws-stepfunctions";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {Queue} from "aws-cdk-lib/aws-sqs";
import {SqsEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

const prefix = 'senado-cl-workflows';

interface AdminApiWorkflowsSubstackProps {
  distributionId: string
  layers: LayerVersion[]
  dataBucket: IBucket
}

export default class AdminWorkflowsSubstack extends NestedStack {

  readonly legSesGetSaveWf: StateMachine;

  constructor(scope: Construct, {distributionId, layers, dataBucket}: AdminApiWorkflowsSubstackProps) {
    super(scope, prefix);

    this.legSesGetSaveWf = this.createLegSesGetSaveDistillStateMachine(dataBucket, layers, distributionId);
    this.createSenListWf(dataBucket, layers);
  }

  createSenListWf(dataBucket: IBucket, layers: LayerVersion[]) {
    const nuevosSenadoresQueue = new Queue(this, `${prefix}-senadores-saveNew-queue`, {
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(1),
    });

    const saveNuevosSenadoresFn = new ScraperFunction(this, `${prefix}-senadores-saveNew`, {
      pckName: 'ASD',
      handler: 'ASD.ASD',
      layers,
      timeout: 180,
      environment: {
        QUEUE_URL: nuevosSenadoresQueue.queueUrl
      },
    });

    dataBucket.grantReadWrite(saveNuevosSenadoresFn);
    saveNuevosSenadoresFn.addEventSource(new SqsEventSource(nuevosSenadoresQueue));
    nuevosSenadoresQueue.grantConsumeMessages(saveNuevosSenadoresFn);
  }

  createLegSesGetSaveDistillStateMachine(dataBucket: IBucket, layers: LayerVersion[], distributionId: string): StateMachine {
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
      timeout: 180,
      memorySize: 512
    });
    dataBucket.grantReadWrite(distillSaveLegislatura);

    return new StateMachine(this, `${prefix}-legislatura-getSaveDistill-Wf`, {
      definitionBody: DefinitionBody.fromChainable(
        new LambdaInvoke(this, `${prefix}-sesiones-getSave-step`, {
          lambdaFunction: sesionesGetSaveFunction,
          outputPath: JsonPath.stringAt("$.Payload")
        })
          .next(
            new LambdaInvoke(this, `${prefix}-legislatura-distill-step`, {
              lambdaFunction: distillSaveLegislatura,
              payload: TaskInput.fromObject({
                "legId.$": "$$.Execution.Input.legId"
              }),
              outputPath: JsonPath.stringAt("$.Payload")
            })
          )
      ),
      stateMachineType: StateMachineType.STANDARD,
      timeout: Duration.seconds(370),
      stateMachineName: `${prefix}-legislatura-sesiones-getSaveDistill-Wf`,
    });
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
