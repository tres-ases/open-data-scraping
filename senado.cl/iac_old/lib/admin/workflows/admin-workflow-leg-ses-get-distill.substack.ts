import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {DefinitionBody, JsonPath, Parallel, StateMachine, StateMachineType, TaskInput} from "aws-cdk-lib/aws-stepfunctions";
import {LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";
import {Queue} from "aws-cdk-lib/aws-sqs";

const prefix = 'senadoClWorkflows-LegSesExtractDistill';

interface AdminApiWorkflowsSubstackProps {
  layers: LayerVersion[]
  dataBucket: IBucket
  senSlugQueue: Queue
  proyBolIdQueue: Queue
}

export default class AdminWorkflowLegSesGetDistillSubstackSubstack extends NestedStack {

  readonly stateMachine: StateMachine;

  constructor(scope: Construct, {layers, dataBucket, senSlugQueue, proyBolIdQueue}: AdminApiWorkflowsSubstackProps) {
    super(scope, prefix);

    const sesionesGetSaveFunction = new ScraperFunction(this, `${prefix}-SesExtractSaveFn`, {
      pckName: 'Sesiones',
      handler: 'sesiones-extractSaveRaw.handler',
      layers,
      timeout: 180
    });
    dataBucket.grantWrite(sesionesGetSaveFunction);

    const distillSaveLegislatura = new ScraperFunction(this, `${prefix}-legislatura-distill`, {
      pckName: 'Legislaturas',
      handler: 'legislaturas-distill.handler',
      layers,
      timeout: 180,
      memorySize: 512
    });
    dataBucket.grantReadWrite(distillSaveLegislatura);

    const newSenSlug = new ScraperFunction(this, `${prefix}-DetectNewSlugsFn`, {
      pckName: 'Senadores',
      handler: 'senadores-detectNewSlugs.handler',
      layers,
      timeout: 180,
      memorySize: 512,
      environment: {
        NEW_SEN_SLUGS_QUEUE_URL: senSlugQueue.queueUrl
      },
    });
    dataBucket.grantReadWrite(newSenSlug);
    senSlugQueue.grantSendMessages(newSenSlug);

    const newProyBolId = new ScraperFunction(this, `${prefix}-DetectNew2QueueFn`, {
      pckName: 'Proyectos',
      handler: 'proyectos-detectNew2Queue.handler',
      layers,
      timeout: 180,
      memorySize: 512,
      environment: {
        NEW_SEN_SLUGS_QUEUE_URL: proyBolIdQueue.queueUrl
      },
    });
    dataBucket.grantReadWrite(newProyBolId);
    proyBolIdQueue.grantSendMessages(newProyBolId);

    this.stateMachine = new StateMachine(this, `${prefix}-legislatura-getSaveDistill-Wf`, {
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
          .next(
            new Parallel(this, `${prefix}-detect-new-slugs-bolIds`)
              .branch(
                new LambdaInvoke(this, `${prefix}-detect-new-slugs-step`, {
                  lambdaFunction: newSenSlug,
                  payload: TaskInput.fromObject({
                    "legId.$": "$$.Execution.Input.legId"
                  }),
                  outputPath: JsonPath.stringAt("$.Payload")
                })
              )
              .branch(
                new LambdaInvoke(this, `${prefix}-detect-new-bolIds-step`, {
                  lambdaFunction: newProyBolId,
                  payload: TaskInput.fromObject({
                    "legId.$": "$$.Execution.Input.legId"
                  }),
                  outputPath: JsonPath.stringAt("$.Payload")
                })
              )
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
