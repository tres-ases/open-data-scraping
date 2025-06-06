import {NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Table} from "aws-cdk-lib/aws-dynamodb";

interface Props extends NestedStackProps {
  bucket: Bucket
  dynamoTables: Table[]
}

export default class RecreateTablesSubStack extends NestedStack {
  readonly stateMachine: CfnStateMachine;

  constructor(scope: Construct, id: string, {
    bucket, dynamoTables
  }: Props) {
    super(scope, id);

    const logGroup = new LogGroup(this, `${id}-smLogs`, {
      logGroupName: `/aws/SenCl/states/${id}-sm`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.THREE_MONTHS
    });

    const smRole = new Role(this, `${id}-smRole`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
      roleName: `${id}-smRole`
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
            'dynamodb:BatchGetItem',
            'dynamodb:Describe*',
            'dynamodb:List*',
            'dynamodb:GetAbacStatus',
            'dynamodb:GetItem',
            'dynamodb:GetResourcePolicy',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:PartiQLSelect',
          ],
          resources: dynamoTables.map(t => t.tableArn),
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
          actions: [
            'athena:startQueryExecution',
            'athena:stopQueryExecution',
            'athena:getQueryExecution',
            'athena:getDataCatalog',
            'athena:GetQueryResults',
          ],
          resources: [
            `arn:aws:athena:${this.region}:${this.account}:workgroup/*`,
            `arn:aws:athena:${this.region}:${this.account}:datacatalog/*`
          ]
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
          resources: [
            `arn:aws:glue:${this.region}:${this.account}:catalog`,
            `arn:aws:glue:${this.region}:${this.account}:database/*`,
            `arn:aws:glue:${this.region}:${this.account}:table/*`,
            `arn:aws:glue:${this.region}:${this.account}:userDefinedFunction/*`
          ]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'lakeformation:GetDataAccess',
            'lambda:*'
          ],
          resources: ['*']
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'iam:PassRole'
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'iam:PassedToService': 'lambda.amazonaws.com'
            }
          }
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:ListBucketMultipartUploads',
            's3:ListMultipartUploadParts',
            's3:AbortMultipartUpload',
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
            's3:DeleteObject',
            's3:DeleteFolder',
          ],
          resources: [`${bucket.bucketArn}/tables/*`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:ListBucket',
          ],
          resources: [bucket.bucketArn],
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
      },
      stateMachineType: StateMachineType.STANDARD,
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
}
