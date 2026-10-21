import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';
import * as schema from './schema';

// Resolve SSL CA certificate bundle (e.g. AWS RDS global-bundle.pem)
const caCertPath = path.resolve(process.cwd(), 'global-bundle.pem');
const caCert = fs.existsSync(caCertPath) ? fs.readFileSync(caCertPath).toString() : undefined;

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    ...(caCert ? { ca: caCert } : {}),
  },
});

export const db = drizzle(pool, { schema });

/**
 * Tests database connectivity and logs success or error.
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log(`✅ Database connected successfully to ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Database connection failed for ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}:`, error?.message || error);
    return false;
  }
}

