#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StorageStack } from './stacks/storage-stack';
import { ProcessingStack } from './stacks/processing-stack';
import { ApiStack } from './stacks/api-stack';
import { FrontendStack } from './stacks/frontend-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || 'us-east-1';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: region,
};

// Storage Stack - Foundation for all data storage
const storageStack = new StorageStack(app, `ODM-${environment}-Storage`, {
  env,
  environment,
  description: 'Open Data - Storage infrastructure (S3, DynamoDB)',
});

// Processing Stack - Lambda functions and Step Functions
const processingStack = new ProcessingStack(app, `ODM-${environment}-Processing`, {
  env,
  environment,
  description: 'Open Data - Data processing infrastructure',
  // Pass storage resources
  dataBucket: storageStack.dataBucket,
  legislatorsTable: storageStack.legislatorsTable,
  sessionsTable: storageStack.sessionsTable,
  analyticsTable: storageStack.analyticsTable,
  votationsTable: storageStack.votationsTable,
  projectsTable: storageStack.projectsTable,
  expensesTable: storageStack.expensesTable,
});

// API Stack - API Gateway and Lambda handlers
const apiStack = new ApiStack(app, `ODM-${environment}-API`, {
  env,
  environment,
  description: 'Open Data - API Gateway and handlers',
  // Pass storage resources
  dataBucket: storageStack.dataBucket,
  legislatorsTable: storageStack.legislatorsTable,
  sessionsTable: storageStack.sessionsTable,
  analyticsTable: storageStack.analyticsTable,
  votationsTable: storageStack.votationsTable,
  projectsTable: storageStack.projectsTable,
  expensesTable: storageStack.expensesTable,
});

// Frontend Stack - CloudFront and S3 for web app
const frontendStack = new FrontendStack(app, `ODM-${environment}-Frontend`, {
  env,
  environment,
  description: 'Open Data - Frontend infrastructure',
  // Pass API Gateway URL
  apiGatewayUrl: apiStack.apiGatewayUrl,
});

// Add dependencies
processingStack.addDependency(storageStack);
apiStack.addDependency(storageStack);
frontendStack.addDependency(apiStack);

// Add tags to all stacks
const tags = {
  Project: 'OpenDataMotivation',
  Environment: environment,
  ManagedBy: 'CDK',
};

Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});
