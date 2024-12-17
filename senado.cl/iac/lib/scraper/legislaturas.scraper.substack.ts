import {CfnOutput, NestedStack, NestedStackProps} from "aws-cdk-lib";
import {Connection} from "aws-cdk-lib/aws-events";
import {Effect, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {CfnStateMachine, StateMachineType} from "aws-cdk-lib/aws-stepfunctions";
import {Construct} from "constructs";
import * as fs from "fs";

interface Props extends NestedStackProps {
  bucket: Bucket
  connection: Connection
}

export default class LegislaturasScraperSubStack extends NestedStack {

  constructor(scope: Construct, id: string, {bucket, connection}: Props) {
    super(scope, id);

    const smRole = new Role(this, `${id}-role`, {
      assumedBy: new ServicePrincipal('states.amazonaws.com'),
    });
    const smRolePolicy = new Policy(this, 'smPolicy', {
      policyName: `${id}-smPolicy`,
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:Abort*',
            's3:DeleteObject*',
            's3:GetBucket*',
            's3:GetObject*',
            's3:List*',
            's3:PutObject',
            's3:PutObjectLegalHold',
            's3:PutObjectRetention',
            's3:PutObjectTagging',
            's3:PutObjectVersionTagging'
          ],
          resources: [
            bucket.bucketArn,
            `${bucket.bucketArn}/*`
          ]
        }),
        new PolicyStatement({
          sid: 'RetrieveConnectionCredentials',
          effect: Effect.ALLOW,
          actions: ["events:RetrieveConnectionCredentials"],
          resources: [connection.connectionArn]
        }),
        new PolicyStatement({
          sid: 'GetAndDescribeSecretValueForConnection',
          effect: Effect.ALLOW,
          actions: [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
          ],
          resources: [connection.connectionSecretArn]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'logs:CreateLogDelivery',
            'logs:GetLogDelivery',
            'logs:UpdateLogDelivery',
            'logs:DeleteLogDelivery',
            'logs:ListLogDeliveries',
            'logs:PutResourcePolicy',
            'logs:DescribeResourcePolicies',
            'logs:DescribeLogGroups'
          ],
          resources: ['*'],
        })
      ]
    });
    smRole.attachInlinePolicy(smRolePolicy);

    let definition = fs.readFileSync('./lib/scraper/asl/legislaturas.asl.json', 'utf8');

    const sm = new CfnStateMachine(this, `${id}-sm`, {
      roleArn: smRole.roleArn,
      definitionString: definition,
      definitionSubstitutions: {
        events_connection_arn: connection.connectionArn,
        bucket_name: bucket.bucketName,
      },
      stateMachineName: `${id}-sm`,
      stateMachineType: StateMachineType.EXPRESS,
      tracingConfiguration: {
        enabled: true
      },
    });
    smRole.addToPolicy(
      new PolicyStatement({
        sid: 'InvokeHttpEndpoint',
        effect: Effect.ALLOW,
        actions: ["states:InvokeHTTPEndpoint"],
        resources: [sm.attrArn]
      })
    );


    new CfnOutput(this, '${events_connection_arn}', {
      value: connection.connectionArn,
    });
    new CfnOutput(this, '${bucket_name}', {
      value: bucket.bucketName,
    });
  }
}
