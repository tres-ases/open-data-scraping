import {Code, LayerVersion, Runtime} from "aws-cdk-lib/aws-lambda";
import {aws_lambda_nodejs as nodejs, Duration} from "aws-cdk-lib";
import {Construct} from "constructs";
import {ServicePrincipal} from "aws-cdk-lib/aws-iam";

interface AdminFunctionProps {
  pckName: string,
  handler: string,
  layers?: LayerVersion[],
  timeout?: number,
}

function codeFromPackage(name: string) {
  return Code.fromAsset(`../admin/api/${name}/dist`);
}

export default class AdminFunction extends nodejs.NodejsFunction {

  constructor(scope: Construct, id: string, {pckName, handler, layers = [], timeout = 30}: AdminFunctionProps) {
    super(scope, id, {
      functionName: id,
      code: codeFromPackage(pckName),
      handler,
      runtime: Runtime.NODEJS_20_X,
      layers,
      timeout: Duration.seconds(timeout)
    });

    //this.role?.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AWSStepFunctionsFullAccess"));
    this.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'));

  }
}
