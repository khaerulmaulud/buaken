import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID').optional(),
    merchantId: z.string().uuid('Invalid merchant ID').optional(),
    menuItemId: z.string().uuid('Invalid menu item ID').optional(),
    imageUrl: z.string().url('Invalid image URL').optional(),
    imageUrls: z
      .array(z.string().url('Invalid image URL'))
      .max(5, 'Maximum 5 images allowed per review')
      .optional(),
    rating: z
      .number()
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    comment: z
      .string()
      .min(5, 'Comment must be at least 5 characters')
      .optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    rating: z
      .number()
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5')
      .optional(),
    comment: z
      .string()
      .min(5, 'Comment must be at least 5 characters')
      .optional(),
  }),
});

export const listReviewsSchema = z.object({
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
