import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import 'dotenv/config';
export const env = createEnv({
  server: {
    // Server
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.string().default('3000').transform(Number),

    // Database
    DATABASE_URL: z.string().url(),

    // Supabase (optional — local storage is used by default)
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_KEY: z.string().min(1).optional(),
    SUPABASE_BUCKET: z.string().min(1).optional(),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().min(1).default('1h'),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),

    // CORS
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    // File Upload (optional)
    MAX_FILE_SIZE: z.string().optional().transform(Number).default('5242880'),
    ALLOWED_FILE_TYPES: z
      .string()
      .optional()
      .default('image/jpeg,image/png,image/webp'),

    // Email (optional)
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional().transform(Number),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z
      .string()
      .email()
      .optional()
      .default('noreply@fooddelivery.com'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .optional()
      .transform(Number)
      .default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z
      .string()
      .optional()
      .transform(Number)
      .default('100'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
