# Local Markets Marketplace - Serverless Ecommerce Platform

## 🎯 Project Overview

A serverless ecommerce platform designed to connect local agricultural producers with consumers in Medellín, Colombia. This marketplace addresses the lack of timely information about local markets by providing a centralized platform where farmers can showcase their products and customers can discover, pre-order, and purchase fresh local produce.

## 🌱 Purpose & Context

Local markets play a crucial role in city economies by creating meeting points between citizens and farmers while maintaining interaction with surrounding businesses. After the pandemic, local markets gained importance as direct acquisition became a great alternative to traditional buying and selling channels.

**Key Benefits:**
- Greater compensation for small and medium producers
- Fresher products for consumers
- Strengthened local economy
- Transparency and formality in local commerce

**Problem Solved:**
The main challenge identified in local markets is the lack of timely information about dates, locations, and products to be sold, mostly promoted through word-of-mouth. This platform provides an alternative channel for visibility and organization.

## 👥 Target Users

### Sellers (Producers/Vendors)
- Local farmers and agricultural producers
- Small entrepreneurs in the food sector
- Artisans selling food-related products
- **Capabilities:** Manage inventory, create product listings, manage orders, announce product sales

### Customers (Buyers)
- Residents of Medellín interested in local products
- People looking for fresh, less processed products
- Consumers who prefer supporting local economy
- **Capabilities:** Browse products by market/location, pre-order items, schedule deliveries, discover new vendors

### Markets (Physical Locations)
- Strategic points in the city where farmers gather weekly
- Managed by the municipality (Alcaldía de Medellín)
- Serve as filtering criteria for products and vendors

## 🏗️ Technology Stack

### Backend (Serverless)
- **AWS CDK** - Infrastructure as Code
- **AWS Lambda** - Serverless compute
- **Amazon API Gateway** - RESTful API management
- **Amazon DynamoDB** - NoSQL database
- **Amazon Cognito** - Authentication & user management
- **Amazon S3** - File storage (product images)
- **Amazon EventBridge** - Event-driven architecture
- **Amazon SES** - Email notifications

### Frontend
- **React.js** - User interface
- **AWS Amplify** - Hosting and CI/CD
- **Tailwind CSS** - Styling framework

### Additional Services
- **Amazon CloudFront** - CDN for global content delivery
- **AWS X-Ray** - Application monitoring and debugging
- **Amazon CloudWatch** - Logging and metrics

## 📁 Project Structure (Monorepo)

```
serverless-project/
├── infrastructure/          # AWS CDK infrastructure code
│   ├── lib/
│   │   ├── api-stack.ts
│   │   ├── auth-stack.ts
│   │   ├── database-stack.ts
│   │   └── storage-stack.ts
│   ├── bin/
│   └── package.json
├── api/                    # Lambda functions
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── markets/
│   │   │   └── users/
│   │   ├── shared/
│   │   └── types/
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── shared/                 # Shared types and utilities
└── package.json           # Root package.json
```

## 🗺️ Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up monorepo structure
- [ ] Configure AWS CDK project
- [ ] Deploy basic infrastructure (DynamoDB, API Gateway, Cognito)
- [ ] Create basic Lambda functions for CRUD operations
- [ ] Set up CI/CD pipeline

### Phase 2: Core Features (Weeks 3-4)
- [ ] **Authentication System**
  - User registration/login for customers and sellers
  - Role-based access control
  - Email verification
- [ ] **Market Management**
  - CRUD operations for markets
  - Location-based filtering
- [ ] **Product Management**
  - Product CRUD for sellers
  - Category management
  - Image upload to S3

### Phase 3: Ecommerce Features (Weeks 5-6)
- [ ] **Shopping Cart & Orders**
  - Add/remove items from cart
  - Order placement and tracking
  - Order history
- [ ] **Inventory Management**
  - Stock tracking
  - Low inventory alerts
  - Bulk product updates

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] **Search & Discovery**
  - Product search functionality
  - Filter by market, category, seller
  - Recommendations engine
- [ ] **Notifications**
  - Email notifications for orders
  - Market schedule updates
  - Promotional announcements

### Phase 5: Enhancement & Optimization (Weeks 9-10)
- [ ] **Performance Optimization**
  - Implement caching strategies
  - Optimize database queries
  - Add monitoring and alerting
- [ ] **User Experience**
  - Mobile responsiveness
  - PWA capabilities
  - Accessibility improvements

## 🚀 Core Features to Implement

### For Customers
- Browse products by market location
- Filter products by category, price, seller
- Pre-order and reserve products
- Schedule delivery or pickup
- Order tracking and history
- Seller ratings and reviews

### For Sellers
- Inventory management dashboard
- Product listing with images and descriptions
- Order management and fulfillment
- Sales analytics and reporting
- Market schedule management
- Customer communication tools

### For Markets
- Market information and schedules
- Vendor management
- Location-based product aggregation
- Market analytics dashboard

## 🔧 Getting Started

### Prerequisites
- Node.js 18+
- AWS CLI configured
- AWS CDK CLI installed
- Git

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd serverless-project

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cd infrastructure
npx cdk bootstrap

# Deploy infrastructure
npm run deploy

# Start frontend development
cd ../frontend
npm run dev
```

## 📋 Entity Relationships

### Core Entities
- **Users** (customers, sellers)
- **Markets** (physical locations)
- **Products** (with categories)
- **Orders** (customer purchases)
- **Categories** (product classification)
- **Inventory** (stock management)

### Key Relationships
- Sellers belong to Markets
- Products belong to Sellers and Categories
- Orders contain multiple Products
- Users can be both Customers and Sellers

## 🎯 Success Metrics
- Number of active sellers and customers
- Product variety and availability
- Order completion rate
- Customer satisfaction scores
- Market coverage across Medellín

---

This project serves as a comprehensive serverless architecture learning experience while solving a real-world problem for local communities in Medellín.