import fs from 'fs';
import path from 'path';
import type { Config } from 'drizzle-kit';
import { env } from './src/config/env';

// Allow AWS RDS self-signed / private certificate chain during migrations
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const caCertPath = path.resolve(process.cwd(), 'global-bundle.pem');
const caCert = fs.existsSync(caCertPath) ? fs.readFileSync(caCertPath).toString() : undefined;

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
      ...(caCert ? { ca: caCert } : {}),
    } as any,
  },
} satisfies Config;
