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

const prefix = 'senadores';
const pckName = 'Senadores';

export default class SenadoresSubstack extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const {bucket, commonsLy, scraperLy} = props;

    const getSaveSenadoresPeriodos = new SenadoNodejsFunction(this, `${prefix}-getSaveSenadoresPeriodos`, {
      pckName,
      handler: 'senadores.getSaveSenadoresPeriodosHandler',
      layers: [commonsLy, scraperLy]
    });
    bucket.grantWrite(getSaveSenadoresPeriodos);
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
