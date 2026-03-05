import { z } from 'zod';

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().min(2, 'Label must be at least 2 characters'),
    addressLine: z.string().min(5, 'Address must be at least 5 characters'),
    latitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid latitude'),
    longitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid longitude'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
    notes: z.string().optional(),
    isDefault: z.boolean().default(false),
  }),
});

export const updateAddressSchema = z.object({
  body: createAddressSchema.shape.body.partial(),
});

export const setDefaultAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
});
