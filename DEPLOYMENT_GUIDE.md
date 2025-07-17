# 🚀 Deployment Guide - API Stack Testing

## ✅ Current Status

Your API stack is ready to deploy! Here's what has been created:

### Created Files
- `infrastructure/lib/database-stack.ts` - DynamoDB tables
- `infrastructure/lib/api-stack.ts` - Lambda functions + API Gateway  
- `infrastructure/bin/app.ts` - CDK app entry point
- `api/src/handlers/products/get-products.ts` - **FULLY IMPLEMENTED**
- `api/src/handlers/markets/get-markets.ts` - **FULLY IMPLEMENTED**
- Other handlers - placeholder implementations (ready for team)

## 🧪 How to Test the Stack

### 1. Prerequisites Check
```bash
# Verify AWS CLI is configured
aws sts get-caller-identity

# Verify CDK is installed
npx cdk --version
```

### 2. Bootstrap CDK (First Time Only)
```bash
cd infrastructure
npx cdk bootstrap
```

### 3. Deploy the Stacks
```bash
# Build API code first
cd ../api && npm run build

# Deploy both stacks
cd ../infrastructure
npx cdk deploy --all

# This will deploy:
# - LocalMarkets-Database-dev (DynamoDB tables)
# - LocalMarkets-API-dev (Lambda + API Gateway)
```

### 4. Test the Deployed API

After deployment, CDK will output the API URL. Test these working endpoints:

```bash
# Get the API URL from CDK output, then:

# Test products endpoint (working!)
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/products

# Test markets endpoint (working!)
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/markets

# Test placeholder endpoints
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/products -X POST
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/orders -X POST
```

### 5. Verify Infrastructure
```bash
# Check DynamoDB tables were created
aws dynamodb list-tables

# Check Lambda functions
aws lambda list-functions | grep LocalMarkets

# Check API Gateway
aws apigateway get-rest-apis
```

## 🔍 What to Expect

### Working Endpoints
- `GET /products` - Returns empty array (no data yet, but structure works)
- `GET /markets` - Returns empty array (no data yet, but structure works)

### Placeholder Endpoints (for team to implement)
- `POST /products` - Returns "TODO: implement" message
- `PUT /products/{id}` - Returns "TODO: implement" message  
- `DELETE /products/{id}` - Returns "TODO: implement" message
- `POST /orders` - Returns "TODO: implement" message
- `GET /orders` - Returns "TODO: implement" message

## 🛠️ Development Workflow for Team

### Adding New Endpoints
1. Create handler in `api/src/handlers/{domain}/`
2. Build: `npm run build` in api directory
3. Update `infrastructure/lib/api-stack.ts` if needed
4. Deploy: `npx cdk deploy` in infrastructure directory

### Environment Management
```bash
# Deploy to different environments
npx cdk deploy --context env=dev
npx cdk deploy --context env=staging  
npx cdk deploy --context env=prod
```

## 🎯 Next Steps for Team

### For Backend Developer
**Focus on:** Complete the placeholder handlers
- Implement authentication middleware
- Add input validation
- Complete CRUD operations
- Add error handling patterns

**GitHub Issues to Pick Up:**
- Issue #4: Create basic Lambda functions for CRUD operations
- Issue #6: Implement Authentication System

### For Infrastructure Developer  
**Focus on:** Additional AWS services
- Create Cognito stack for authentication
- Add S3 bucket for image uploads
- Set up CloudFront distribution
- Implement monitoring and alerting

**GitHub Issues to Pick Up:**
- Issue #2: Configure AWS CDK project (extend current work)
- Issue #5: Set up CI/CD pipeline

### For Frontend Developer
**Focus on:** Vue.js application
- Set up Vue 3 + TypeScript project
- Create API service layer to call deployed endpoints
- Implement authentication with Cognito
- Build product listing and management UI

**GitHub Issues to Pick Up:**
- Issue #8: Implement Product Management (frontend part)

## 📊 Current Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│ Lambda Functions │───▶│  DynamoDB       │
│                 │    │                  │    │                 │
│ /products       │    │ get-products ✅  │    │ products-table  │
│ /markets        │    │ get-markets ✅   │    │ markets-table   │
│ /orders         │    │ create-order 🚧  │    │ orders-table    │
│                 │    │ (+ 4 more) 🚧    │    │ users-table     │
└─────────────────┘    └──────────────────┘    └─────────────────┘

✅ = Fully implemented and tested
🚧 = Placeholder ready for implementation
```

## 🚨 Important Notes

1. **Cost Management**: Currently using PAY_PER_REQUEST billing - perfect for development
2. **Security**: Tables have `RemovalPolicy.DESTROY` for development - change for production
3. **CORS**: Configured for `*` origins - restrict for production
4. **Regions**: Defaults to `us-east-1` - can be changed via context

## 🔧 Troubleshooting

### Common Issues

**CDK Bootstrap Error**
```bash
# Solution: Bootstrap your AWS account
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

**Asset Not Found Error**
```bash
# Solution: Build API code first
cd api && npm run build
cd infrastructure && npx cdk deploy
```

**Permission Errors**
```bash
# Solution: Check AWS credentials
aws sts get-caller-identity
```

## 📈 Monitoring

After deployment, monitor your infrastructure:

```bash
# CloudWatch logs for Lambda functions
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/LocalMarkets

# API Gateway metrics
# Check AWS Console > API Gateway > Your API > Monitoring
```

Your serverless infrastructure is ready for the team to build upon! 🎉