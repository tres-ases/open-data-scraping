import {CfnElement, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";

interface Props extends NestedStackProps {
  bucket: Bucket
}

export default class DeleteTableFolderSubStack extends NestedStack {
  readonly stateMachine: CfnStateMachine;

  constructor(scope: Construct, id: string, {bucket}: Props) {
    super(scope, id);

    const logGroup = new LogGroup(this, `${id}-smLogs`, {
      logGroupName: `/aws/vendedlogs/states/${id}-sm`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.THREE_MONTHS
    });

    const smRole = new Role(this, `${id}-role`, {
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
          actions: [
            's3:ListBucket',
            's3:DeleteObject',
            's3:DeleteFolder',
          ],
          resources: [
            `${bucket.bucketArn}/tables/*`,
          ],
        }),
      ]
    });
    smRole.attachInlinePolicy(smRolePolicy);

    const definition = fs.readFileSync('./lib/tables/asl/delete-table-folder.asl.json', 'utf8');

    this.stateMachine = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: smRole.roleArn,
      definitionString: definition,
      stateMachineName: `${id}-sm`,
      definitionSubstitutions: {
        bucket_name: bucket.bucketName
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
