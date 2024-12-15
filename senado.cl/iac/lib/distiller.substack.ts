import {NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import ProyectoDistillerSubStack from "./distiller/proyecto.distiller.substack";

interface Props extends NestedStackProps {
  bucket: Bucket
}

export default class DistillerSubstack extends NestedStack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const {bucket} = props;

    new ProyectoDistillerSubStack(this, `${id}-proyecto`, {bucket})
  }
}
