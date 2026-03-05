import { z } from 'zod';

export const createMerchantSchema = z.object({
  body: z.object({
    storeName: z.string().min(3, 'Store name must be at least 3 characters'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters'),
    logoUrl: z
      .union([z.string().url('Invalid logo URL'), z.literal('')])
      .optional(),
    bannerUrl: z
      .union([z.string().url('Invalid banner URL'), z.literal('')])
      .optional(),
    addressLine: z.string().min(5, 'Address must be at least 5 characters'),
    latitude: z
      .union([
        z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid latitude'),
        z.literal(''),
      ])
      .optional(),
    longitude: z
      .union([
        z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid longitude'),
        z.literal(''),
      ])
      .optional(),
    city: z.string().min(2, 'City must be at least 2 characters'),
    phone: z.string().regex(/^[0-9+\-() ]{10,20}$/, 'Invalid phone number'),
    openingTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
        'Invalid time format (HH:MM)',
      ),
    closingTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
        'Invalid time format (HH:MM)',
      ),
    deliveryFee: z.number().min(0, 'Delivery fee cannot be negative'),
    minOrder: z.number().min(0, 'Minimum order cannot be negative'),
    estimatedDeliveryTime: z
      .number()
      .int()
      .min(0, 'Estimated delivery time cannot be negative'),
  }),
});

export const updateMerchantSchema = z.object({
  body: createMerchantSchema.shape.body.partial(),
});

export const toggleStatusSchema = z.object({
  body: z.object({
    isOpen: z.boolean(),
  }),
});

export const listMerchantsSchema = z.object({
  query: z.object({
    city: z.string().optional(),
    isOpen: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    search: z.string().optional(),
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
