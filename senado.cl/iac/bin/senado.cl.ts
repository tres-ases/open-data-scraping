#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import ScraperStack from "../lib/scraper.stack";

const app = new cdk.App();
new ScraperStack(app, 'senado-cl-scraper', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
