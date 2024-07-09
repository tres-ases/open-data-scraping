import {
  Duration,
  Stack,
  StackProps,
  aws_lambda_nodejs as nodejs,
} from 'aws-cdk-lib';
import {Architecture, Code, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {DefinitionBody, Parallel, StateMachine, Succeed} from 'aws-cdk-lib/aws-stepfunctions';
import {LambdaInvoke} from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';

export class SenadoClStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const openDataBucket = new Bucket(this, 'openDataBucket', {
      bucketName: 'open-data-senado-cl'
    });

    const commonsLy = new LayerVersion(this, 'commons-ly', {
      layerVersionName: 'commons-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../packages/Commons/layer'),
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

    const dietaAnoMesSaveJsonStructuredFn = new nodejs.NodejsFunction(this, 'dieta-anoMes-saveAnosJsonStructured-fn', {
        code: Code.fromAsset('../packages/Dieta-AnoMes/dist'),
        handler: 'dieta-anomes.saveAnosJsonStructured',
        runtime: Runtime.NODEJS_20_X,
        layers: [commonsLy, scraperLy]
      }
    );
    openDataBucket.grantWrite(dietaAnoMesSaveJsonStructuredFn);

    const dietaAnoMesSaveJsonLinesFn = new nodejs.NodejsFunction(this, 'dieta-anoMes-saveAnosJsonLines-fn', {
        code: Code.fromAsset('../packages/Dieta-AnoMes/dist'),
        handler: 'dieta-anomes.saveAnosJsonLines',
        runtime: Runtime.NODEJS_20_X,
        layers: [commonsLy, scraperLy]
      }
    );
    openDataBucket.grantWrite(dietaAnoMesSaveJsonLinesFn);

    const dietaAnoMesGetFn = new nodejs.NodejsFunction(this, 'dieta-anoMes-getAnos-fn', {
        code: Code.fromAsset('../packages/Dieta-AnoMes/dist'),
        handler: 'dieta-anomes.getAnosHandler',
        runtime: Runtime.NODEJS_20_X,
        layers: [commonsLy, scraperLy]
      }
    );

    const dietaAnoMesJob = new LambdaInvoke(
      this,
      "dieta-anomes-get-job", {
        lambdaFunction: dietaAnoMesGetFn,
      }
    );

    const stateMachineDefinition = dietaAnoMesJob
      .next(new Parallel(this, 'dieta-anoMes-save')
        .branch(new LambdaInvoke(
          this,
          "dieta-anoMes-saveJsonLines-job", {
            lambdaFunction: dietaAnoMesGetFn,
          }
        ))
        .branch(new LambdaInvoke(
          this,
          "dieta-anoMes-saveJsonStructured-job", {
            lambdaFunction: dietaAnoMesGetFn,
          }
        ))
      );

    const stateMachine = new StateMachine(this, "dieta-anoMes-sm", {
      definitionBody: DefinitionBody.fromChainable(
        stateMachineDefinition
      ),
      timeout: Duration.minutes(5),
      stateMachineName: "Dieta-AnoMes-Job",
    });
  }
}
