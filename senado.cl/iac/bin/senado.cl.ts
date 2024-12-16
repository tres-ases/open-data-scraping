#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import MainStack from "../lib/main.stack";

const app = new cdk.App();
console.log('process.env', JSON.stringify(process.env));

if(process.env.CDK_DEFAULT_ACCOUNT === undefined) {
  console.error('process.env.CDK_DEFAULT_ACCOUNT no existe!');
}

else {
  new MainStack(app, 'SenadoCl', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  });
}
