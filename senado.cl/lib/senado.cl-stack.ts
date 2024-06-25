import {
  Stack,
  StackProps,
  aws_lambda_nodejs as nodejs,
} from 'aws-cdk-lib';
import {Architecture, Code, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Construct} from 'constructs';

export class SenadoClStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const simpleFn = new nodejs.NodejsFunction(this, 'simple-function', {
        code: Code.fromAsset('./src/Example/lib'),
        handler: 'simple.handler',
        runtime: Runtime.NODEJS_20_X,
      }
    );

    const scraperLy = new LayerVersion(this, 'scraper-layer', {
      layerVersionName: 'scraper-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../layers/scraper'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    })
  }
}
