#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SenadoClStack } from '../lib/senado.cl-stack';
import AdminStack from "../lib/admin/admin.stack";

const app = new cdk.App();
new SenadoClStack(app, 'odata-scraping-senado-cl', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
new AdminStack(app, 'odata-admin-senado-cl', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
