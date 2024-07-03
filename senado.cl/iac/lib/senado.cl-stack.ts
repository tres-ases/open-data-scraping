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

    const commonsLy = new LayerVersion(this, 'commons-layer', {
      layerVersionName: 'commons-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../code/packages/Commons/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const scraperLy = new LayerVersion(this, 'scraper-layer', {
      layerVersionName: 'scraper-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../layers/scraper'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const simpleFn = new nodejs.NodejsFunction(this, 'simple-function', {
        code: Code.fromAsset('../code/packages/Example/dist'),
        handler: 'simple.handler',
        runtime: Runtime.NODEJS_20_X,
        layers: [commonsLy, scraperLy]
      }
    );

    const dietaAnoMesFn = new nodejs.NodejsFunction(this, 'simple-function', {
        code: Code.fromAsset('../code/packages/Dieta-AnoMes/dist'),
        handler: 'dieta-anomes.handler',
        runtime: Runtime.NODEJS_20_X,
        layers: [commonsLy, scraperLy]
      }
    );

    const dietaAnoMesJob = new LambdaInvoke(
      this,
      "dieta-ano-mes-job", {
        lambdaFunction: dietaAnoMesFn,
      }
    );

    const stateMachineDefinition = dietaAnoMesJob
      .next(new Succeed(this, "dieta-ano-mes-succeed"));

    const stateMachine = new StateMachine(this, "state-machine", {
      definitionBody: DefinitionBody.fromChainable(
        stateMachineDefinition
      ),
      timeout: Duration.minutes(5),
      stateMachineName: "ProcessAndReportJob",
    });
  }
}
