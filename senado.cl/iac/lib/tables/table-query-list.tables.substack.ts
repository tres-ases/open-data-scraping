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
      'table-legislaturas',
      'table-materias',
      'table-parlamentarios',
      'table-parlamentarios-enlaces',
      'table-parlamentarios-periodos',
      'table-parlamentarios-regiones',
      'table-partidos',
      'table-proyectos',
      'table-proyectos-autores',
      'table-proyectos-comparados',
      'table-proyectos-informes',
      'table-proyectos-materias',
      'table-proyectos-oficios',
      'table-sesiones',
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
}
