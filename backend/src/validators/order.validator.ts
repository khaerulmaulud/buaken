import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z
    .object({
      merchantId: z.string().uuid('Invalid merchant ID'),
      deliveryAddress: z
        .string()
        .min(5, 'Address must be at least 5 characters')
        .optional(),
      deliveryAddressId: z.string().uuid('Invalid address ID').optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      paymentMethod: z
        .enum(['cash', 'digital_wallet', 'bank_transfer'])
        .default('cash'),
      items: z
        .array(
          z.object({
            menuItemId: z.string().uuid('Invalid menu item ID'),
            quantity: z.number().int().positive('Quantity must be positive'),
            notes: z.string().optional(),
          }),
        )
        .min(1, 'At least one item is required'),
      deliveryNotes: z.string().optional(),
    })
    .refine((data) => data.deliveryAddress || data.deliveryAddressId, {
      message: 'Either delivery address text or ID is required',
      path: ['deliveryAddress'],
    }),
});

export const cancelOrderSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .min(5, 'Cancellation reason must be at least 5 characters')
      .optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'on_delivery',
      'delivered',
      'cancelled',
    ]),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive())
      .optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive().max(100))
      .optional(),
  }),
});
