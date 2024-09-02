#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ScraperStack } from '../lib/scraper-stack';
import AdminStack from "../lib/admin.stack";

const app = new cdk.App();
new ScraperStack(app, 'odata-scraping-senado-cl', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
new AdminStack(app, 'odata-admin-senado-cl', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
