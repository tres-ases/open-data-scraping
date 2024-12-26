import {NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import DeleteTableFolderSubStack from "./tables/delete-table-folder.tables.substack";
import RecreateTablesSubStack from "./tables/recreate-tables.tables.substack";

interface Props extends NestedStackProps {
  bucket: Bucket
}

export default class BuildTablesSubstack extends NestedStack {
  constructor(scope: Construct, id: string, {bucket, ...props}: Props) {
    super(scope, id, props);

    const deleteFolderSubStack = new DeleteTableFolderSubStack(this, `${id}-deleteFolder`, {
      bucket
    });

    new RecreateTablesSubStack(this, `${id}-recreateTable`, {
      bucket, deleteTableFolderStateMachine: deleteFolderSubStack.stateMachine
    });
  }
}
