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

const prefix = 'votaciones';
const pckName = 'Votaciones';

export default class VotacionesSubstack extends NestedStack {
  constructor(scope: Construct, props: Props) {
    super(scope, prefix, props);
    const {bucket, commonsLy, scraperLy} = props;

    const getSaveLegislaturas = new SenadoNodejsFunction(this, `${prefix}-getSaveLegislaturas`, {
      pckName,
      handler: 'votaciones.getSaveLegislaturasHandler',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(getSaveLegislaturas);

    const getSaveLegislaturasSesiones = new SenadoNodejsFunction(this, `${prefix}-getSaveLegislaturasSesiones`, {
      pckName,
      handler: 'votaciones.getSaveLegislaturasSesionesHandler',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(getSaveLegislaturasSesiones);

    const getSaveLegislaturasJob = new LambdaInvoke(
      this,
      `${prefix}-getSaveLegislaturas-job`, {
        lambdaFunction: getSaveLegislaturasSesiones,
      }
    );

    const stateMachineDefinition = getSaveLegislaturasJob
      .next(
        new Map(this, `${prefix}-getSaveLegislaturasSesiones-map`, {
          maxConcurrency: 20,
          itemsPath: JsonPath.stringAt('$.Payload')
        })
          .itemProcessor(new LambdaInvoke(
              this,
              `${prefix}-getSaveLegislaturasSesiones-job`, {
                lambdaFunction: getSaveLegislaturasSesiones,
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
