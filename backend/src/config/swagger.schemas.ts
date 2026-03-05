/**
 * Reusable OpenAPI Schema Components
 * These schemas are referenced throughout the API documentation
 */

export const swaggerSchemas = {
  // Common Response Schemas
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Operation completed successfully',
      },
      data: {
        type: 'object',
        description: 'Response data (varies by endpoint)',
      },
    },
  },

  SuccessResponseWithMeta: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Data retrieved successfully',
      },
      data: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
      meta: {
        $ref: '#/components/schemas/PaginationMeta',
      },
    },
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          message: {
            type: 'string',
            example: 'Invalid request data',
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
    },
  },

  PaginationMeta: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        example: 1,
        description: 'Current page number',
      },
      limit: {
        type: 'integer',
        example: 10,
        description: 'Items per page',
      },
      total: {
        type: 'integer',
        example: 100,
        description: 'Total number of items',
      },
      totalPages: {
        type: 'integer',
        example: 10,
        description: 'Total number of pages',
      },
    },
  },

  // User Schemas
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '550e8400-e29b-41d4-a716-446655440000',
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com',
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      phone: {
        type: 'string',
        example: '+628123456789',
      },
      role: {
        $ref: '#/components/schemas/UserRole',
      },
      avatarUrl: {
        type: 'string',
        nullable: true,
        example: 'https://example.com/avatar.jpg',
      },
      isVerified: {
        type: 'boolean',
        example: true,
      },
      isActive: {
        type: 'boolean',
        example: true,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'name', 'phone', 'role'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'newuser@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'SecurePass123',
        description:
          'Must be at least 8 characters with uppercase, lowercase, and number',
      },
      name: {
        type: 'string',
        minLength: 2,
        example: 'John Doe',
      },
      phone: {
        type: 'string',
        example: '+628123456789',
        description: 'Phone number (10-20 characters)',
      },
      role: {
        $ref: '#/components/schemas/UserRole',
      },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'SecurePass123',
      },
    },
  },

  AuthResponse: {
    type: 'object',
    properties: {
      user: {
        $ref: '#/components/schemas/User',
      },
      token: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },

  // Address Schemas
  Address: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      userId: {
        type: 'string',
        format: 'uuid',
      },
      label: {
        type: 'string',
        example: 'Home',
      },
      addressLine: {
        type: 'string',
        example: 'Jl. Sudirman No. 123',
      },
      latitude: {
        type: 'string',
        example: '-6.2088',
      },
      longitude: {
        type: 'string',
        example: '106.8456',
      },
      city: {
        type: 'string',
        example: 'Jakarta',
      },
      postalCode: {
        type: 'string',
        example: '12190',
      },
      notes: {
        type: 'string',
        nullable: true,
        example: 'Ring the doorbell twice',
      },
      isDefault: {
        type: 'boolean',
        example: true,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  CreateAddressRequest: {
    type: 'object',
    required: [
      'label',
      'addressLine',
      'latitude',
      'longitude',
      'city',
      'postalCode',
    ],
    properties: {
      label: {
        type: 'string',
        example: 'Home',
      },
      addressLine: {
        type: 'string',
        example: 'Jl. Sudirman No. 123',
      },
      latitude: {
        type: 'string',
        example: '-6.2088',
      },
      longitude: {
        type: 'string',
        example: '106.8456',
      },
      city: {
        type: 'string',
        example: 'Jakarta',
      },
      postalCode: {
        type: 'string',
        example: '12190',
      },
      notes: {
        type: 'string',
        example: 'Ring the doorbell twice',
      },
      isDefault: {
        type: 'boolean',
        example: false,
      },
    },
  },

  UpdateAddressRequest: {
    type: 'object',
    properties: {
      label: {
        type: 'string',
        example: 'Office',
      },
      addressLine: {
        type: 'string',
        example: 'Jl. Thamrin No. 456',
      },
      latitude: {
        type: 'string',
        example: '-6.1944',
      },
      longitude: {
        type: 'string',
        example: '106.8229',
      },
      city: {
        type: 'string',
        example: 'Jakarta',
      },
      postalCode: {
        type: 'string',
        example: '10340',
      },
      notes: {
        type: 'string',
        example: 'Ask security for access',
      },
    },
  },

  // Merchant Schemas
  Merchant: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      userId: {
        type: 'string',
        format: 'uuid',
      },
      storeName: {
        type: 'string',
        example: 'Warung Padang Sederhana',
      },
      description: {
        type: 'string',
        example: 'Authentic Padang cuisine',
      },
      logoUrl: {
        type: 'string',
        nullable: true,
        example: 'https://example.com/logo.jpg',
      },
      bannerUrl: {
        type: 'string',
        nullable: true,
        example: 'https://example.com/banner.jpg',
      },
      addressLine: {
        type: 'string',
        example: 'Jl. Merdeka No. 100',
      },
      latitude: {
        type: 'string',
        example: '-6.2088',
      },
      longitude: {
        type: 'string',
        example: '106.8456',
      },
      city: {
        type: 'string',
        example: 'Jakarta',
      },
      phone: {
        type: 'string',
        example: '+622112345678',
      },
      isOpen: {
        type: 'boolean',
        example: true,
      },
      rating: {
        type: 'number',
        format: 'decimal',
        example: 4.5,
      },
      totalReviews: {
        type: 'integer',
        example: 150,
      },
      openingTime: {
        type: 'string',
        example: '08:00',
      },
      closingTime: {
        type: 'string',
        example: '22:00',
      },
      deliveryFee: {
        type: 'number',
        format: 'decimal',
        example: 10000,
      },
      minOrder: {
        type: 'number',
        format: 'decimal',
        example: 25000,
      },
      estimatedDeliveryTime: {
        type: 'integer',
        example: 30,
        description: 'Estimated delivery time in minutes',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  UpdateMerchantRequest: {
    type: 'object',
    properties: {
      storeName: {
        type: 'string',
        example: 'Warung Padang Sederhana',
      },
      description: {
        type: 'string',
        example: 'Best Padang food in town',
      },
      logoUrl: {
        type: 'string',
        example: 'https://example.com/logo.jpg',
      },
      bannerUrl: {
        type: 'string',
        example: 'https://example.com/banner.jpg',
      },
      addressLine: {
        type: 'string',
        example: 'Jl. Merdeka No. 100',
      },
      latitude: {
        type: 'string',
        example: '-6.2088',
      },
      longitude: {
        type: 'string',
        example: '106.8456',
      },
      city: {
        type: 'string',
        example: 'Jakarta',
      },
      phone: {
        type: 'string',
        example: '+622112345678',
      },
      isOpen: {
        type: 'boolean',
        example: true,
      },
      openingTime: {
        type: 'string',
        example: '08:00',
      },
      closingTime: {
        type: 'string',
        example: '22:00',
      },
      deliveryFee: {
        type: 'number',
        format: 'decimal',
        example: 10000,
      },
      minOrder: {
        type: 'number',
        format: 'decimal',
        example: 25000,
      },
      estimatedDeliveryTime: {
        type: 'integer',
        example: 30,
      },
    },
  },

  // Menu Schemas
  Category: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      name: {
        type: 'string',
        example: 'Main Course',
      },
      slug: {
        type: 'string',
        example: 'main-course',
      },
      iconUrl: {
        type: 'string',
        nullable: true,
        example: 'https://example.com/icon.jpg',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  MenuItem: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      merchantId: {
        type: 'string',
        format: 'uuid',
      },
      categoryId: {
        type: 'string',
        format: 'uuid',
      },
      name: {
        type: 'string',
        example: 'Nasi Rendang',
      },
      description: {
        type: 'string',
        example: 'Steamed rice with beef rendang',
      },
      price: {
        type: 'number',
        format: 'decimal',
        example: 35000,
      },
      imageUrl: {
        type: 'string',
        nullable: true,
        example: 'https://example.com/rendang.jpg',
      },
      isAvailable: {
        type: 'boolean',
        example: true,
      },
      stock: {
        type: 'integer',
        nullable: true,
        example: 50,
      },
      preparationTime: {
        type: 'integer',
        example: 15,
        description: 'Preparation time in minutes',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  CreateMenuItemRequest: {
    type: 'object',
    required: ['categoryId', 'name', 'description', 'price', 'preparationTime'],
    properties: {
      categoryId: {
        type: 'string',
        format: 'uuid',
      },
      name: {
        type: 'string',
        example: 'Nasi Rendang',
      },
      description: {
        type: 'string',
        example: 'Steamed rice with beef rendang',
      },
      price: {
        type: 'number',
        format: 'decimal',
        example: 35000,
      },
      imageUrl: {
        type: 'string',
        example: 'https://example.com/rendang.jpg',
      },
      isAvailable: {
        type: 'boolean',
        example: true,
      },
      stock: {
        type: 'integer',
        example: 50,
      },
      preparationTime: {
        type: 'integer',
        example: 15,
      },
    },
  },

  UpdateMenuItemRequest: {
    type: 'object',
    properties: {
      categoryId: {
        type: 'string',
        format: 'uuid',
      },
      name: {
        type: 'string',
        example: 'Nasi Rendang Spesial',
      },
      description: {
        type: 'string',
        example: 'Premium beef rendang with steamed rice',
      },
      price: {
        type: 'number',
        format: 'decimal',
        example: 45000,
      },
      imageUrl: {
        type: 'string',
        example: 'https://example.com/rendang-special.jpg',
      },
      isAvailable: {
        type: 'boolean',
        example: true,
      },
      stock: {
        type: 'integer',
        example: 30,
      },
      preparationTime: {
        type: 'integer',
        example: 20,
      },
    },
  },

  // Order Schemas
  OrderItem: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      orderId: {
        type: 'string',
        format: 'uuid',
      },
      menuItemId: {
        type: 'string',
        format: 'uuid',
      },
      quantity: {
        type: 'integer',
        example: 2,
      },
      price: {
        type: 'number',
        format: 'decimal',
        example: 35000,
      },
      notes: {
        type: 'string',
        nullable: true,
        example: 'Extra spicy please',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  Order: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      orderNumber: {
        type: 'string',
        example: 'ORD-20260207-001',
      },
      customerId: {
        type: 'string',
        format: 'uuid',
      },
      merchantId: {
        type: 'string',
        format: 'uuid',
      },
      courierId: {
        type: 'string',
        format: 'uuid',
        nullable: true,
      },
      deliveryAddressId: {
        type: 'string',
        format: 'uuid',
      },
      deliveryNotes: {
        type: 'string',
        nullable: true,
        example: 'Please call when arrived',
      },
      subtotal: {
        type: 'number',
        format: 'decimal',
        example: 70000,
      },
      deliveryFee: {
        type: 'number',
        format: 'decimal',
        example: 10000,
      },
      serviceFee: {
        type: 'number',
        format: 'decimal',
        example: 2000,
      },
      totalAmount: {
        type: 'number',
        format: 'decimal',
        example: 82000,
      },
      status: {
        $ref: '#/components/schemas/OrderStatus',
      },
      paymentMethod: {
        $ref: '#/components/schemas/PaymentMethod',
      },
      paymentStatus: {
        $ref: '#/components/schemas/PaymentStatus',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      confirmedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      pickedUpAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      deliveredAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      cancelledAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
      cancellationReason: {
        type: 'string',
        nullable: true,
      },
      orderItems: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/OrderItem',
        },
      },
    },
  },

  CreateOrderRequest: {
    type: 'object',
    required: ['merchantId', 'items', 'paymentMethod'],
    description: 'Either deliveryAddressId or deliveryAddress text is required',
    properties: {
      merchantId: {
        type: 'string',
        format: 'uuid',
        description: 'ID of the merchant/restaurant',
      },
      deliveryAddressId: {
        type: 'string',
        format: 'uuid',
        description:
          'ID of saved delivery address (use this OR deliveryAddress)',
      },
      deliveryAddress: {
        type: 'string',
        example: 'Jl. Sudirman No. 123, Jakarta',
        description:
          'Text-based delivery address (use this OR deliveryAddressId)',
      },
      deliveryNotes: {
        type: 'string',
        example: 'Please call when arrived',
      },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['menuItemId', 'quantity'],
          properties: {
            menuItemId: {
              type: 'string',
              format: 'uuid',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 2,
            },
            notes: {
              type: 'string',
              example: 'Extra spicy',
            },
          },
        },
      },
      paymentMethod: {
        $ref: '#/components/schemas/PaymentMethod',
      },
    },
  },

  UpdateOrderStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        $ref: '#/components/schemas/OrderStatus',
      },
    },
  },

  CancelOrderRequest: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        example: 'Changed my mind',
        description: 'Optional cancellation reason',
      },
    },
  },

  // Courier Schemas
  CourierProfile: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      userId: {
        type: 'string',
        format: 'uuid',
      },
      vehicleType: {
        type: 'string',
        example: 'motorcycle',
      },
      vehicleNumber: {
        type: 'string',
        example: 'B 1234 CD',
      },
      isOnline: {
        type: 'boolean',
        example: true,
      },
      currentLatitude: {
        type: 'string',
        nullable: true,
        example: '-6.2088',
      },
      currentLongitude: {
        type: 'string',
        nullable: true,
        example: '106.8456',
      },
      rating: {
        type: 'number',
        format: 'decimal',
        example: 4.7,
      },
      totalDeliveries: {
        type: 'integer',
        example: 250,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  CreateCourierRequest: {
    type: 'object',
    required: ['vehicleType', 'vehicleNumber'],
    properties: {
      vehicleType: {
        type: 'string',
        example: 'motorcycle',
      },
      vehicleNumber: {
        type: 'string',
        example: 'B 1234 CD',
      },
    },
  },

  UpdateCourierLocationRequest: {
    type: 'object',
    required: ['latitude', 'longitude'],
    properties: {
      latitude: {
        type: 'string',
        example: '-6.2088',
      },
      longitude: {
        type: 'string',
        example: '106.8456',
      },
    },
  },

  // Review Schemas
  Review: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
      orderId: {
        type: 'string',
        format: 'uuid',
      },
      customerId: {
        type: 'string',
        format: 'uuid',
      },
      merchantId: {
        type: 'string',
        format: 'uuid',
      },
      rating: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        example: 5,
      },
      comment: {
        type: 'string',
        nullable: true,
        example: 'Great food and fast delivery!',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  CreateReviewRequest: {
    type: 'object',
    required: ['orderId', 'merchantId', 'rating'],
    properties: {
      orderId: {
        type: 'string',
        format: 'uuid',
      },
      merchantId: {
        type: 'string',
        format: 'uuid',
      },
      rating: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        example: 5,
      },
      comment: {
        type: 'string',
        example: 'Excellent service!',
      },
    },
  },

  // Enum Schemas
  UserRole: {
    type: 'string',
    enum: ['customer', 'merchant', 'courier'],
    example: 'customer',
  },

  OrderStatus: {
    type: 'string',
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'on_delivery',
      'delivered',
      'cancelled',
    ],
    example: 'pending',
  },

  PaymentMethod: {
    type: 'string',
    enum: ['cash', 'digital_wallet', 'bank_transfer'],
    example: 'cash',
  },

  PaymentStatus: {
    type: 'string',
    enum: ['pending', 'paid', 'refunded'],
    example: 'pending',
  },
};
