import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';
import { swaggerSchemas } from './swagger.schemas.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Food Delivery Express API',
    version: '1.0.0',
    description: `
      Food Delivery Express API provides comprehensive endpoints for managing a food delivery platform.
      
      **Features:**
      - User authentication and authorization (Customer, Merchant, Courier roles)
      - Restaurant/merchant management
      - Menu and category management
      - Order processing and tracking
      - Address management
      - Courier operations
      - Review and rating system
      
      **Authentication:**
      Most endpoints require JWT authentication. Use the /auth/login endpoint to obtain a token,
      then click the "Authorize" button and enter: Bearer <your-token>
    `,
    contact: {
      name: 'API Support',
      email: 'support@fooddeliveryexpress.com',
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT || 3000}`,
      description: 'Development server',
    },
    {
      url: 'https://api.fooddeliveryexpress.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token in the format: Bearer <token>',
      },
    },
    schemas: swaggerSchemas,
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and account management',
    },
    {
      name: 'Addresses',
      description: 'User address management',
    },
    {
      name: 'Merchants',
      description: 'Restaurant/merchant operations and discovery',
    },
    {
      name: 'Menu',
      description: 'Menu items and category management',
    },
    {
      name: 'Orders',
      description: 'Order creation, tracking, and management',
    },
    {
      name: 'Couriers',
      description: 'Courier operations and delivery management',
    },
    {
      name: 'Reviews',
      description: 'Restaurant reviews and ratings',
    },
  ],
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  // Path to the API routes files with JSDoc annotations
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './dist/routes/*.js', // For production build
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
