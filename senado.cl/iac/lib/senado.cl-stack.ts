import {
  Duration,
  Stack,
  StackProps,
  aws_lambda_nodejs as nodejs,
} from 'aws-cdk-lib';
import {Architecture, Code, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {DefinitionBody, StateMachine, Succeed} from 'aws-cdk-lib/aws-stepfunctions';
import {LambdaInvoke}  from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {Construct} from 'constructs';

export class SenadoClStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const commonsLy = new LayerVersion(this, 'commons-ly', {
      layerVersionName: 'commons-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../packages/packages/Commons/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const scraperLy = new LayerVersion(this, 'scraper-ly', {
      layerVersionName: 'scraper-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../layers/scraper'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const simpleFn = new nodejs.NodejsFunction(this, 'simple-fn', {
        code: Code.fromAsset('../packages/packages/Example/dist'),
        handler: 'simple.handler',
        runtime: Runtime.NODEJS_20_X,
        layers: [commonsLy, scraperLy]
      }
    );

    const dietaAnoMesFn = new nodejs.NodejsFunction(this, 'dieta-anomes-fn', {
        code: Code.fromAsset('../packages/packages/Dieta-AnoMes/dist'),
        handler: 'dieta-anomes.handler',
        runtime: Runtime.NODEJS_20_X,
        layers: [commonsLy, scraperLy]
      }
    );

    const dietaAnoMesJob = new LambdaInvoke(
      this,
      "dieta-anomes-job", {
        lambdaFunction: dietaAnoMesFn,
      }
    );

    const stateMachineDefinition = dietaAnoMesJob
      .next(new Succeed(this, "dieta-anomes-succeed"));

    const stateMachine = new StateMachine(this, "dieta-anomes-sm", {
      definitionBody: DefinitionBody.fromChainable(
        stateMachineDefinition
      ),
      timeout: Duration.minutes(5),
      stateMachineName: "Dieta-AnoMes-Job",
    });
  }
}
