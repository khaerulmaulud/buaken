import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

// Create PostgreSQL connection
const queryClient = postgres(env.DATABASE_URL, { max: 10, prepare: false });

// Create Drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in repositories
export { schema };
