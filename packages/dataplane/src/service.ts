import * as Sentry from '@sentry/bun';
import { Service } from '@shutters/shutterkit';
import { libsqlIntegration } from 'sentry-integration-libsql-client';
import { health, profiles } from './api';
import { initDb, libsqlClient, runMigrations } from './db';
import * as ingester from './ingester';

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
      case 'migrate':
        await runMigrations(this.logger.child({ component: 'migrator' }));
        break;

      case 'ingester':
        await ingester.start(this.logger.child({ component: 'ingester' }));
        break;

      default:
        return super.start();
    }
  }
}
