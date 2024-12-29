import {CfnElement, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Construct} from "constructs";
import RecreateTablesSubStack from "./tables/recreate-table.tables.substack";
import {Table} from "aws-cdk-lib/aws-dynamodb";
import TableQueryListSubStack from "./tables/table-query-list.tables.substack";

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

    const recreateTables = new RecreateTablesSubStack(this, `${id}-recTable`, {
      bucket,
      dynamoTables: [sesionesTable, parlamentariosTable, proyectosTable]
    });

    new TableQueryListSubStack(this, `${id}-tblQryList`, {
      recreateTableStateMachine: recreateTables.stateMachine
    });
  }
}
