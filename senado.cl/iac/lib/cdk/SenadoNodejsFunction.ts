import {Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import {aws_lambda_nodejs as nodejs, Duration} from "aws-cdk-lib";
import {Construct} from "constructs";

interface SenadoNodejsFunctionProps {
  pckName: string,
  handler: string,
  layers?: LayerVersion[],
  timeout?: number,
}

function codeFromPackage(name: string) {
  return Code.fromAsset(`../packages/${name}/dist`);
}

export default class SenadoNodejsFunction extends nodejs.NodejsFunction {

  constructor(scope: Construct, id: string, {pckName, handler, layers = [], timeout = 30}: SenadoNodejsFunctionProps) {
    super(scope, id, {
      functionName: id,
      code: codeFromPackage(pckName),
      handler,
      runtime: Runtime.NODEJS_20_X,
      layers,
      timeout: Duration.seconds(timeout)
    });
  }
}
