import 'dotenv/config';
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import MainStack from "../lib/main.stack";

const app = new cdk.App();

console.log('process.env',JSON.stringify(process.env));

new MainStack(app, 'SenCl', {
  env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
});
