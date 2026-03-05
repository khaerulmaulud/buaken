import { z } from 'zod';

export const createMenuItemSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    price: z.number().positive('Price must be positive'),
    imageUrl: z.string().optional(),
    isAvailable: z.boolean().default(true),
    stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
    preparationTime: z
      .number()
      .int()
      .positive('Preparation time must be positive'),
  }),
});

export const updateMenuItemSchema = z.object({
  body: createMenuItemSchema.shape.body.partial(),
});

export const toggleAvailabilitySchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
});

export const searchMenuSchema = z.object({
  query: z.object({
    search: z.string().min(1, 'Search query is required'),
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
