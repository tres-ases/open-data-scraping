import {NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import DeleteFolderSubStack from "./tables/delete-folder.tables.substack";

interface Props extends NestedStackProps {
  bucket: Bucket
}

export default class BuildTablesSubstack extends NestedStack {
  constructor(scope: Construct, id: string, {bucket, ...props}: Props) {
    super(scope, id, props);

    new DeleteFolderSubStack(this, `${id}-deleteFolder`, {
      bucket
    });

  }
}
