import {Code, LayerVersion, Runtime, Tracing} from "aws-cdk-lib/aws-lambda";
import {aws_lambda_nodejs as nodejs, Duration} from "aws-cdk-lib";
import {Construct} from "constructs";

interface SenadoNodejsFunctionProps {
  folder?: string,
  handler: string,
  layers?: LayerVersion[],
  timeout?: number,
  memorySize?: number,
  environment?: {
    [key: string]: string;
  },
  reservedConcurrentExecutions?: number
}

function codeFromPackage(folder?: string) {
  return Code.fromAsset(`../../../artifact/distiller-dist/${folder ? `${folder}/` : ''}dist`);
}

export default class SenadoFunction extends nodejs.NodejsFunction {

  constructor(scope: Construct, id: string, {folder, handler, layers = [], timeout = 30, memorySize, environment, reservedConcurrentExecutions}: SenadoNodejsFunctionProps) {
    super(scope, id, {
      functionName: id,
      code: codeFromPackage(folder),
      handler,
      runtime: Runtime.NODEJS_20_X,
      layers,
      timeout: Duration.seconds(timeout),
      memorySize,
      environment,
      reservedConcurrentExecutions,
      tracing: Tracing.ACTIVE
    });
  }
}
