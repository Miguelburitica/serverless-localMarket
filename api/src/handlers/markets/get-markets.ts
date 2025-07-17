import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { city } = event.queryStringParameters || {};
    
    const command = new ScanCommand({
      TableName: process.env.MARKETS_TABLE_NAME,
      FilterExpression: city ? 'city = :city' : undefined,
      ExpressionAttributeValues: city ? { ':city': city } : undefined,
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      },
      body: JSON.stringify({
        markets: result.Items || [],
        count: result.Count || 0
      })
    };
  } catch (error) {
    console.error('Error fetching markets:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch markets',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};