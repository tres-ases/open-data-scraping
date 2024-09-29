import {Construct} from "constructs";
import {CfnElement, Duration, NestedStack,} from 'aws-cdk-lib';
import ScraperFunction from "../cdk/ScraperFunction";
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {DefinitionBody, JsonPath, StateMachine, StateMachineType, TaskInput} from "aws-cdk-lib/aws-stepfunctions";
import {CallAwsService, LambdaInvoke} from "aws-cdk-lib/aws-stepfunctions-tasks";

const prefix = 'senado-cl-workflows';

interface AdminApiWorkflowsSubstackProps {
  distributionId: string
  layers: LayerVersion[]
  dataBucket: IBucket
}

export default class AdminWorkflowsSubstack extends NestedStack {

  readonly sesionesGetSaveWf: StateMachine;

  constructor(scope: Construct, {distributionId, layers, dataBucket}: AdminApiWorkflowsSubstackProps) {
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
      timeout: 180,
      memorySize: 512
    });
    dataBucket.grantReadWrite(distillSaveLegislatura);

    this.sesionesGetSaveWf = new StateMachine(this, `${prefix}-legislatura-getSaveDistill-Wf`, {
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
            new CallAwsService(this, `${prefix}-legislatura-getSaveDistill-invCache-step`, {
              service: 'cloudfront',
              action: 'createInvalidation',
              parameters: {
                DistributionId: distributionId,
                InvalidationBatch: {
                  CallerReference: JsonPath.stringAt('$$.Execution.Id'),
                  Paths: {
                    Quantity: 1,
                    Items: [
                      '/api/dtl/*'
                      // JsonPath.format('legislatura/{}', sfn.JsonPath.stringAt('$.legId'))
                    ]
                  }
                }
              },
              iamResources: ['*'], // Puedes restringir este permiso a recursos específicos
              resultPath: '$.invalidationResult' // Dónde almacenar el resultado
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
