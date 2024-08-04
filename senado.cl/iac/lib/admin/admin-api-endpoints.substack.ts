import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";
import AdminNodejsFunction from "../cdk/AdminNodejsFunction";

const prefix = 'senado-cl-admin-api';

interface AdminApiEndpointsSubstackProps {
  api: RestApi
}

export default class AdminApiEndpointsSubstack extends NestedStack {

  constructor(scope: Construct, {api}: AdminApiEndpointsSubstackProps) {
    super(scope, prefix);

    const senadoresLambda = new AdminNodejsFunction(this, `${prefix}-Senadores-Fn`, {
      pckName: 'Senadores',
      handler: 'senadores.hi'
    })

    const senadoresLambdaInt = new LambdaIntegration(senadoresLambda);

    api.root.addMethod('GET', senadoresLambdaInt);
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
