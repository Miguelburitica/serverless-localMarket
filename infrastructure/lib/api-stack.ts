import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { join } from 'path';

interface ApiStackProps extends StackProps {
  // Tables from database stack
  productsTable: dynamodb.Table;
  usersTable: dynamodb.Table;
  ordersTable: dynamodb.Table;
  marketsTable: dynamodb.Table;
}

export class ApiStack extends Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create shared Lambda execution role with DynamoDB permissions
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
                `${props.usersTable.tableArn}/index/*`,
                `${props.ordersTable.tableArn}/index/*`,
                `${props.marketsTable.tableArn}/index/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Shared Lambda function configuration
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
      // Note: bundling will be handled by separate build process
    };

    // ======================
    // PRODUCTS FUNCTIONS
    // ======================
    
    const getProductsFunction = new lambda.Function(this, 'GetProductsFunction', {
      ...lambdaDefaults,
      functionName: `${id}-get-products`,
      code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/products')),
      handler: 'get-products.handler',
      description: 'Get products with optional market filtering',
    });

    const createProductFunction = new lambda.Function(this, 'CreateProductFunction', {
      ...lambdaDefaults,
      functionName: `${id}-create-product`,
      code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/products')),
      handler: 'create-product.handler',
      description: 'Create new product (sellers only)',
    });

    const updateProductFunction = new lambda.Function(this, 'UpdateProductFunction', {
      ...lambdaDefaults,
      functionName: `${id}-update-product`,
      code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/products')),
      handler: 'update-product.handler',
      description: 'Update existing product (seller/owner only)',
    });

    const deleteProductFunction = new lambda.Function(this, 'DeleteProductFunction', {
      ...lambdaDefaults,
      functionName: `${id}-delete-product`,
      code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/products')),
      handler: 'delete-product.handler',
      description: 'Delete product (seller/owner only)',
    });

    // ======================
    // MARKETS FUNCTIONS
    // ======================
    
    const getMarketsFunction = new lambda.Function(this, 'GetMarketsFunction', {
      ...lambdaDefaults,
      functionName: `${id}-get-markets`,
      code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/markets')),
      handler: 'get-markets.handler',
      description: 'Get all markets with location filtering',
    });

    // ======================
    // ORDERS FUNCTIONS
    // ======================
    
    const createOrderFunction = new lambda.Function(this, 'CreateOrderFunction', {
      ...lambdaDefaults,
      functionName: `${id}-create-order`,
      code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/orders')),
      handler: 'create-order.handler',
      description: 'Create new order (customers only)',
    });

    const getUserOrdersFunction = new lambda.Function(this, 'GetUserOrdersFunction', {
      ...lambdaDefaults,
      functionName: `${id}-get-user-orders`,
      code: lambda.Code.fromAsset(join(__dirname, '../../api/dist/handlers/orders')),
      handler: 'get-user-orders.handler',
      description: 'Get orders for authenticated user',
    });

    // ======================
    // API GATEWAY SETUP
    // ======================
    
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

    // ======================
    // API ROUTES DEFINITION
    // ======================
    
    // /products routes
    const productsResource = this.api.root.addResource('products');
    
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsFunction, {
      proxy: true,
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      }],
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProductFunction, {
      proxy: true,
    }));

    // /products/{id} routes
    const productByIdResource = productsResource.addResource('{id}');
    
    productByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updateProductFunction, {
      proxy: true,
    }));

    productByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteProductFunction, {
      proxy: true,
    }));

    // /markets routes
    const marketsResource = this.api.root.addResource('markets');
    
    marketsResource.addMethod('GET', new apigateway.LambdaIntegration(getMarketsFunction, {
      proxy: true,
    }));

    // /orders routes
    const ordersResource = this.api.root.addResource('orders');
    
    ordersResource.addMethod('POST', new apigateway.LambdaIntegration(createOrderFunction, {
      proxy: true,
    }));

    ordersResource.addMethod('GET', new apigateway.LambdaIntegration(getUserOrdersFunction, {
      proxy: true,
    }));

    // ======================
    // OUTPUTS
    // ======================
    
    // Output the API URL for easy access
    new CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'URL of the Local Markets API',
      exportName: `${id}-api-url`,
    });

    // Output individual function ARNs for monitoring/debugging
    new CfnOutput(this, 'GetProductsFunctionArn', {
      value: getProductsFunction.functionArn,
      description: 'ARN of the Get Products Lambda function',
    });
  }
}