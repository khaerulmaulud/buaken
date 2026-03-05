import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  API_URL: process.env.NEXT_PUBLIC_API_URL,
} as const;
