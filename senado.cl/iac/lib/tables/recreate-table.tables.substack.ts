import {CfnElement, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";

interface Props extends NestedStackProps {
  bucket: Bucket
  deleteTableFolderStateMachine: CfnStateMachine
}

export default class RecreateTablesSubStack extends NestedStack {
  readonly stateMachine: CfnStateMachine;

  constructor(scope: Construct, id: string, {bucket, deleteTableFolderStateMachine}: Props) {
    super(scope, id);

    const logGroup = new LogGroup(this, `${id}-smLogs`, {
      logGroupName: `/aws/vendedlogs/states/${id}-sm`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.THREE_MONTHS
    });

    const smRole = new Role(this, `${id}-smRole`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    const smRolePolicy = new Policy(this, `${id}-smPolicy`, {
      policyName: `${id}-smPolicy`,
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogDelivery',
            'logs:CreateLogStream',
            'logs:GetLogDelivery',
            'logs:UpdateLogDelivery',
            'logs:DeleteLogDelivery',
            'logs:ListLogDeliveries',
            'logs:PutLogEvents',
            'logs:PutResourcePolicy',
            'logs:DescribeResourcePolicies',
            'logs:DescribeLogGroups'
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords',
            'xray:GetSamplingRules',
            'xray:GetSamplingTargets'
          ],
          resources: ['*'],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['states:StartSyncExecution'],
          resources: [deleteTableFolderStateMachine.attrArn]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'athena:startQueryExecution',
            'athena:stopQueryExecution',
            'athena:getQueryExecution',
            'athena:getDataCatalog'
          ],
          resources: ['*']
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:ListBucket',
            's3:ListBucketMultipartUploads',
            's3:ListMultipartUploadParts',
            's3:AbortMultipartUpload',
            's3:CreateBucket',
            's3:PutObject'
          ],
          resources: [
            `${bucket.bucketArn}/tables/*`,
            `${bucket.bucketArn}/athena-results/*`,
          ],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:GetBucketLocation',
          ],
          resources: ['arn:aws:s3:::*']
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'glue:CreateDatabase',
            'glue:GetDatabase',
            'glue:GetDatabases',
            'glue:UpdateDatabase',
            'glue:DeleteDatabase',
            'glue:CreateTable',
            'glue:UpdateTable',
            'glue:GetTable',
            'glue:GetTables',
            'glue:DeleteTable',
            'glue:BatchDeleteTable',
            'glue:BatchCreatePartition',
            'glue:CreatePartition',
            'glue:UpdatePartition',
            'glue:GetPartition',
            'glue:GetPartitions',
            'glue:BatchGetPartition',
            'glue:DeletePartition',
            'glue:BatchDeletePartition'
          ],
          resources: ['arn:aws:glue:::*']
        }),
      ]
    });
    smRole.attachInlinePolicy(smRolePolicy);

    const definition = fs.readFileSync('./lib/tables/asl/recreate-table.asl.json', 'utf8');

    this.stateMachine = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: smRole.roleArn,
      definitionString: definition,
      stateMachineName: `${id}-sm`,
      definitionSubstitutions: {
        bucket_name: bucket.bucketName,
        delete_table_folder_state_machine: deleteTableFolderStateMachine.attrArn
      },
      stateMachineType: StateMachineType.EXPRESS,
      tracingConfiguration: {
        enabled: true
      },
      loggingConfiguration: {
        destinations: [{
          cloudWatchLogsLogGroup: {
            logGroupArn: logGroup.logGroupArn
          }
        }],
        includeExecutionData: true,
        level: 'ALL',
      }
    });
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
