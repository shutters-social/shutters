import * as Sentry from '@sentry/bun';
import { Service } from '@shutters/shutterkit';
import { libsqlIntegration } from 'sentry-integration-libsql-client';
import { health, profiles } from './api';
import { initDb, libsqlClient, runMigrations } from './db';

export class DataplaneService extends Service {
  public sentryIntegrations = [libsqlIntegration(libsqlClient, Sentry)];

  protected setup(): void {
    super.setup();

    // Set up DB instance
    initDb(this.logger.child({ component: 'db' }));

    // Set up API routes
    this.app.route('/', health.createRouter());
    this.app.route('/', profiles.createRouter());
  }

  public async start() {
    switch (process.argv[process.argv.length - 1]) {
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
      case 'migrate':
        await runMigrations(this.logger);
        process.exit(0);

      default:
        return super.start();
    }
  }
}
