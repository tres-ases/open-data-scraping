import {CfnElement, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import DeleteTableFolderSubStack from "./tables/delete-table-folder.tables.substack";
import RecreateTablesSubStack from "./tables/recreate-table.tables.substack";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  bucket: Bucket
  legislaturasTable: Table
  sesionesTable: Table
  parlamentariosTable: Table
  proyectosTable: Table
}

export default class BuildTablesSubstack extends NestedStack {
  constructor(scope: Construct, id: string, {
    bucket, legislaturasTable, sesionesTable, parlamentariosTable, proyectosTable, ...props
  }: Props) {
    super(scope, id, props);

    const deleteFolderSubStack = new DeleteTableFolderSubStack(this, `${id}-delFolder`, {
      bucket
    });

    //new RecreateTablesSubStack(this, `${id}-recTable`, {
    //  bucket,
    //  deleteTableFolderStateMachine: deleteFolderSubStack.stateMachine,
    //  dynamoTables: [sesionesTable, parlamentariosTable, proyectosTable]
    //});
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
      } catch (e) {

      }
    }
    return super.getLogicalId(element)
  }
}
