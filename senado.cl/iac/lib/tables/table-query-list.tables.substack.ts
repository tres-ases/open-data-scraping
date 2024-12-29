import {CfnElement, NestedStack, NestedStackProps, RemovalPolicy} from "aws-cdk-lib";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";
import {LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";

interface Props extends NestedStackProps {
  recreateTableStateMachine: CfnStateMachine
}

export default class TableQueryListSubStack extends NestedStack {
  constructor(scope: Construct, id: string, {
    recreateTableStateMachine
  }: Props) {
    super(scope, id);

    const logGroup = new LogGroup(this, `${id}-smLogs`, {
      logGroupName: `/aws/vendedlogs/states/${id}-sm`,
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
          resources: [recreateTableStateMachine.attrArn]
        }),
      ]
    });
    smRole.attachInlinePolicy(smRolePolicy);

    const defJson = JSON.parse(
      fs.readFileSync('./lib/tables/asl/table-query-list.asl.json', 'utf8')
    );
    defJson['States']['Table-Query List']['Output'] = [
      'table-proyectos'
    ].map(table => ({
      table, query: fs.readFileSync(`./lib/tables/query/${table}.sql`, 'utf8')
    }));

    new CfnStateMachine(this, `${id}-sm`, {
      roleArn: smRole.roleArn,
      definitionString: JSON.stringify(defJson),
      stateMachineName: `${id}-sm`,
      definitionSubstitutions: {
        recreate_table_state_machine: recreateTableStateMachine.attrArn
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
