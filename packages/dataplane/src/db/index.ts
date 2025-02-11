import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { config } from '../config';

export const libsqlClient = createClient({
  url: config.DATAPLANE_DB_URL,
  authToken: config.DATAPLANE_DB_AUTH_TOKEN,
  concurrency: config.DATAPLANE_DB_CONCURRENCY,
});

export const db = drizzle(libsqlClient);
