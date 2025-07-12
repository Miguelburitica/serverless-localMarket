import { APIGatewayProxyEvent } from 'aws-lambda';

// Create mock function before it's used in the mock
const mockSend = jest.fn();

// Mock AWS SDK modules before importing the handler
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend
    }))
  },
  ScanCommand: jest.fn()
}));

// Import handler AFTER mocking
import { handler } from './get-products';

describe('GET /products', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRODUCTS_TABLE_NAME = 'test-products-table';
  });

  it('should return products successfully', async () => {
    // Arrange
    const mockProducts = [
      { id: '1', name: 'Apple', price: 2.50 },
      { id: '2', name: 'Banana', price: 1.20 }
    ];
    const mockDynamoResponse = {
      Items: mockProducts,
      Count: 2
    };
    const event: Partial<APIGatewayProxyEvent> = {
      queryStringParameters: null
    };
    mockSend.mockResolvedValue(mockDynamoResponse);

    // Act
    const result = await handler(event as APIGatewayProxyEvent);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      products: mockProducts,
      count: 2
    });
  });

  it('should filter by marketId when provided', async () => {
    // Arrange
    const mockProducts = [
      { id: '1', name: 'Apple', price: 2.50, marketId: 'market-123' }
    ];
    const mockDynamoResponse = {
      Items: mockProducts,
      Count: 1
    };
    const event: Partial<APIGatewayProxyEvent> = {
      queryStringParameters: { marketId: 'market-123' }
    };
    mockSend.mockResolvedValue(mockDynamoResponse);

    // Act
    const result = await handler(event as APIGatewayProxyEvent);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      products: mockProducts,
      count: 1
    });
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const expectedError = new Error('Database error');
    const event: Partial<APIGatewayProxyEvent> = {
      queryStringParameters: null
    };
    mockSend.mockRejectedValue(expectedError);

    // Act
    const result = await handler(event as APIGatewayProxyEvent);

    // Assert
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Failed to fetch products',
      message: 'Database error'
    });
  });
});