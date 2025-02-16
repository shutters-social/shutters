import { createClient } from '@libsql/client';
import type { Logger as DrizzleLogger } from 'drizzle-orm';
import { type LibSQLDatabase } from 'drizzle-orm/libsql';
import { drizzle } from 'drizzle-orm/libsql/web';
import { migrate } from 'drizzle-orm/libsql/migrator';
import type { Logger as PinoLogger } from 'pino';
import { config } from '../config';
import * as schema from './schema';

// Import to fix Docker issues with compiled bin
import '@libsql/linux-x64-gnu';

export const libsqlClient = createClient({
  url: config.DATAPLANE_DB_URL,
  authToken: config.DATAPLANE_DB_AUTH_TOKEN,
  concurrency: config.DATAPLANE_DB_CONCURRENCY,
});

let _db: LibSQLDatabase<typeof schema> | undefined = undefined;

class DbLogger implements DrizzleLogger {
  constructor(
    private logger: PinoLogger,
    private level: 'info' | 'debug',
  ) {}

  logQuery(query: string, params: unknown[]): void {
    this.logger[this.level](
      {
        query,
        params,
      },
      'executing query',
    );
  }
}

export const initDb = (logger: PinoLogger) => {
  _db = drizzle(libsqlClient, {
    logger: new DbLogger(logger, 'info'),
    schema: schema,
  });
};

export const getDb = () => {
  if (_db) return _db;
  throw new Error('DB has not been initialized yet!');
};

export const runMigrations = async (logger: PinoLogger) => {
  logger.info('Running migrations');
  await migrate(getDb(), {
    migrationsFolder: './migrations',
  });
};
