import { z } from 'zod';

export const createCourierProfileSchema = z.object({
  body: z.object({
    vehicleType: z.enum(['motorcycle', 'bicycle', 'car']),
    vehicleNumber: z
      .string()
      .min(3, 'Vehicle number must be at least 3 characters'),
  }),
});

export const updateCourierProfileSchema = z.object({
  body: z.object({
    vehicleType: z.enum(['motorcycle', 'bicycle', 'car']).optional(),
    vehicleNumber: z
      .string()
      .min(3, 'Vehicle number must be at least 3 characters')
      .optional(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid latitude'),
    longitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid longitude'),
  }),
});

export const toggleOnlineStatusSchema = z.object({
  body: z.object({
    isOnline: z.boolean(),
  }),
});

export const listAvailableOrdersSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive().max(100))
      .optional(),
  }),
});
