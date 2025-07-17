# API Stack Architecture Documentation

## Overview

The `api-stack.ts` file defines the core API infrastructure for the Local Markets Marketplace, including Lambda functions and API Gateway configuration. This document explains the architectural decisions and patterns used.

## 🏗️ Architecture Patterns

### 1. Stack Dependencies Pattern

```typescript
interface ApiStackProps extends StackProps {
  productsTable: dynamodb.Table;
  usersTable: dynamodb.Table;
  ordersTable: dynamodb.Table;
  marketsTable: dynamodb.Table;
}
```

**Why This Pattern:**
- **Separation of Concerns**: Database resources are managed in a separate stack
- **Modularity**: API stack can be deployed independently once database exists
- **Reusability**: Same API stack can point to different database environments
- **Dependency Management**: Clear dependency chain prevents circular references

**Benefits:**
- Easy to swap database configurations between environments
- Database stack can be updated without affecting API
- Enables blue/green deployments
- Supports multiple API versions pointing to same database

### 2. Shared IAM Role Strategy

```typescript
const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
  inlinePolicies: {
    DynamoDBAccess: new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
          ],
          resources: [
            props.productsTable.tableArn,
            props.usersTable.tableArn,
            props.ordersTable.tableArn,
            props.marketsTable.tableArn,
            // Include GSI ARNs
            `${props.productsTable.tableArn}/index/*`,
          ],
        }),
      ],
    }),
  },
});
```

**Why Shared Role:**
- **Security**: Consistent permissions across all functions
- **Efficiency**: Reduces IAM role proliferation (AWS has service limits)
- **Maintenance**: Single point to update permissions
- **Cost**: Fewer IAM resources = lower costs

**Security Considerations:**
- Follows principle of least privilege
- Only grants necessary DynamoDB actions
- Includes GSI access patterns
- Separates from admin permissions

### 3. Lambda Function Configuration Pattern

```typescript
const lambdaDefaults = {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  timeout: Duration.seconds(30),
  memorySize: 512,
  role: lambdaRole,
  environment: {
    PRODUCTS_TABLE_NAME: props.productsTable.tableName,
    USERS_TABLE_NAME: props.usersTable.tableName,
    ORDERS_TABLE_NAME: props.ordersTable.tableName,
    MARKETS_TABLE_NAME: props.marketsTable.tableName,
    NODE_ENV: 'production',
  },
  logRetention: logs.RetentionDays.ONE_WEEK,
};
```

**Configuration Decisions:**

**Runtime: Node.js 18.x**
- Modern JavaScript features (ES2022)
- Best AWS Lambda performance for Node.js
- TypeScript compatibility

**Memory: 512MB**
- Balanced between performance and cost
- Sufficient for DynamoDB operations
- Can be adjusted per function if needed

**Timeout: 30 seconds**
- Enough for database operations
- Prevents hung functions
- API Gateway timeout is 30s anyway

**Environment Variables Pattern:**
- Runtime flexibility for different environments
- No hardcoded resource names
- Easy testing with mocked values

### 4. Domain-Based Function Organization

```typescript
// ======================
// PRODUCTS FUNCTIONS
// ======================
const getProductsFunction = new lambda.Function(this, 'GetProductsFunction', {
  // ...
});

const createProductFunction = new lambda.Function(this, 'CreateProductFunction', {
  // ...
});

// ======================
// MARKETS FUNCTIONS
// ======================
const getMarketsFunction = new lambda.Function(this, 'GetMarketsFunction', {
  // ...
});
```

**Why Domain Organization:**
- **Team Collaboration**: Clear ownership boundaries
- **Scalability**: Easy to add new domains (notifications, payments, etc.)
- **Maintainability**: Related functions grouped together
- **Code Navigation**: Developers can find relevant functions quickly

**Domain Boundaries:**
- **Products**: Core marketplace items
- **Markets**: Physical location management
- **Orders**: Transaction and fulfillment
- **Users**: Authentication and profiles (future)

### 5. API Gateway Configuration Strategy

```typescript
this.api = new apigateway.RestApi(this, 'LocalMarketsApi', {
  restApiName: `${id}-api`,
  description: 'API for Local Markets Marketplace',
  defaultCorsPreflightOptions: {
    allowOrigins: apigateway.Cors.ALL_ORIGINS,
    allowMethods: apigateway.Cors.ALL_METHODS,
    allowHeaders: [
      'Content-Type',
      'X-Amz-Date',
      'Authorization',
      'X-Api-Key',
      'X-Amz-Security-Token',
    ],
  },
  deployOptions: {
    stageName: 'prod',
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
    dataTraceEnabled: true,
    metricsEnabled: true,
  },
});
```

**CORS Configuration:**
- **ALL_ORIGINS**: Supports development from localhost
- **ALL_METHODS**: Supports REST operations
- **Security Headers**: Includes AWS signature headers

**Monitoring Configuration:**
- **INFO Logging**: Balance between detail and noise
- **Data Tracing**: Request/response logging for debugging
- **Metrics**: CloudWatch integration for monitoring

### 6. RESTful Route Structure

```typescript
// /products routes
const productsResource = this.api.root.addResource('products');

productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsFunction));
productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductFunction));

// /products/{id} routes
const productByIdResource = productsResource.addResource('{id}');
productByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updateProductFunction));
productByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteProductFunction));
```

**Route Design Principles:**
- **RESTful Conventions**: Standard HTTP methods and resource naming
- **Hierarchical Resources**: Clear parent-child relationships
- **Predictable URLs**: Easy for frontend developers to understand

**Resource Mapping:**
```
GET    /products        → List all products (with filtering)
POST   /products        → Create new product (sellers only)
PUT    /products/{id}   → Update specific product (owner only)
DELETE /products/{id}   → Delete specific product (owner only)

GET    /markets         → List all markets (with location filtering)

POST   /orders          → Create new order (customers only)
GET    /orders          → Get user's orders (filtered by authentication)
```

### 7. Lambda Integration Strategy

```typescript
productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsFunction, {
  proxy: true,
  integrationResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Origin': "'*'",
    },
  }],
}));
```

**Proxy Integration Benefits:**
- **Full Request Context**: Lambda receives headers, query params, path params, body
- **Response Control**: Lambda handles status codes and response formatting
- **Flexibility**: Easy to add authentication, validation, etc.
- **Error Handling**: Consistent error response format

### 8. Infrastructure Outputs

```typescript
new CfnOutput(this, 'ApiUrl', {
  value: this.api.url,
  description: 'URL of the Local Markets API',
  exportName: `${id}-api-url`,
});
```

**Why Outputs:**
- **Frontend Integration**: Easy to get API URL for Vue.js app
- **Cross-Stack References**: Other stacks can import the API URL
- **Automation**: CI/CD can use outputs for integration tests
- **Documentation**: Self-documenting infrastructure

## 🚀 Deployment Considerations

### Environment Strategy
```typescript
functionName: `${id}-get-products`,
```
- Stack ID becomes function prefix
- Enables multiple environments (dev, staging, prod)
- Prevents naming conflicts

### Build Process
```typescript
code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/products')),
```
- Expects pre-built JavaScript in `dist/` folder
- TypeScript compilation happens before CDK deploy
- Supports source maps for debugging

### Monitoring Setup
- CloudWatch Logs with 1-week retention
- API Gateway request/response tracing
- Lambda function metrics enabled
- Ready for alerting and dashboards

## 🔄 Future Enhancements

### 1. Authentication Integration
```typescript
// Future: Add Cognito authorizer
const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
  cognitoUserPools: [props.userPool]
});

productsResource.addMethod('POST', integration, {
  authorizer: authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO,
});
```

### 2. Rate Limiting
```typescript
// Future: Add usage plans
const plan = api.addUsagePlan('UsagePlan', {
  name: 'Easy',
  throttle: {
    rateLimit: 10,
    burstLimit: 2
  }
});
```

### 3. Request Validation
```typescript
// Future: Add request models
const productModel = api.addModel('ProductModel', {
  contentType: 'application/json',
  modelName: 'Product',
  schema: {
    // JSON Schema for product validation
  }
});
```

## 📊 Performance Characteristics

### Expected Latency
- **Cold Start**: ~1-2 seconds (Node.js 18.x)
- **Warm Start**: ~50-100ms
- **DynamoDB Query**: ~10-50ms
- **Total API Response**: ~100-200ms (warm)

### Scalability Limits
- **Concurrent Executions**: 1000 (default AWS limit)
- **API Gateway**: 10,000 requests/second
- **DynamoDB**: Configurable read/write capacity

### Cost Optimization
- Shared IAM role reduces resource count
- 1-week log retention balances debugging vs cost
- 512MB memory allocation balances performance vs cost

## 🔧 Development Workflow

1. **Write Lambda Function**: Create handler in `api/src/handlers/{domain}/`
2. **Build TypeScript**: `npm run build` in api directory
3. **Add to Stack**: Update `api-stack.ts` with new function
4. **Deploy**: `cdk deploy` from infrastructure directory
5. **Test**: Use API Gateway URL from stack outputs

This architecture supports rapid development while maintaining production-ready patterns for monitoring, security, and scalability.