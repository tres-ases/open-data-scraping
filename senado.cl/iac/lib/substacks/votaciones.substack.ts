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

const prefix = 'votaciones';
const pckName = 'Votaciones';

export default class VotacionesSubstack extends NestedStack {
  constructor(scope: Construct, props: Props) {
    super(scope, prefix, props);
    const {bucket, layers} = props;

    const getLegislaturasSesionesIdSinVotacionResumen = new SenadoNodejsFunction(this, `${prefix}-getLegislaturasSesionesIdSinVotacionResumen`, {
      pckName,
      handler: 'votaciones.getLegislaturasSesionesIdSinVotacionResumenHandler',
      layers,
      timeout: 300
    });
    bucket.grantRead(getLegislaturasSesionesIdSinVotacionResumen);

    const getSaveVotacionSimpleList = new SenadoNodejsFunction(this, `${prefix}-getSaveVotacionSimpleList`, {
      pckName,
      handler: 'votaciones.getSaveVotacionSimpleListHandler',
      layers
    });
    bucket.grantWrite(getSaveVotacionSimpleList);

    const getLegislaturasSesionesIdSinVotacionResumenJob = new LambdaInvoke(
      this,
      `${prefix}-getLegislaturasSesionesIdSinVotacionResumen-job`, {
        lambdaFunction: getLegislaturasSesionesIdSinVotacionResumen,
      }
    );

    const stateMachineDefinition = getLegislaturasSesionesIdSinVotacionResumenJob
      .next(
        new Map(this, `${prefix}-getSaveVotacionSimpleList-map`, {
          maxConcurrency: 20,
          itemsPath: JsonPath.stringAt('$.Payload')
        })
          .itemProcessor(new LambdaInvoke(
              this,
              `${prefix}-getSaveVotacionSimpleList-job`, {
                lambdaFunction: getSaveVotacionSimpleList,
                outputPath: JsonPath.stringAt('$.Payload')
              }
            )
          )
      );

    const stateMachine = new StateMachine(this, `${prefix}-resumen-sm`, {
      definitionBody: DefinitionBody.fromChainable(
        stateMachineDefinition
      ),
      stateMachineType: StateMachineType.STANDARD,
      timeout: Duration.minutes(10),
      stateMachineName: `${prefix}-resumen-sm`,
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
