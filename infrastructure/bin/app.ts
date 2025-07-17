#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

// Get environment context
const environment = app.node.tryGetContext('env') || 'dev';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';

const env = {
  account,
  region,
};

// Create database stack first
const databaseStack = new DatabaseStack(app, `LocalMarkets-Database-${environment}`, {
  env,
  description: `Database stack for Local Markets ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'LocalMarkets',
    Stack: 'Database',
  },
});

// Create API stack that depends on database
const apiStack = new ApiStack(app, `LocalMarkets-API-${environment}`, {
  env,
  description: `API stack for Local Markets ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'LocalMarkets',
    Stack: 'API',
  },
  // Pass database tables to API stack
  productsTable: databaseStack.productsTable,
  usersTable: databaseStack.usersTable,
  ordersTable: databaseStack.ordersTable,
  marketsTable: databaseStack.marketsTable,
});

// Add explicit dependency
apiStack.addDependency(databaseStack);