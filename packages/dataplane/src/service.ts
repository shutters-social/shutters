import * as Sentry from '@sentry/bun';
import { Service } from '@shutters/shutterkit';
import { libsqlIntegration } from 'sentry-integration-libsql-client';
import { health, profiles } from './api';
import { libsqlClient } from './db';

export class DataplaneService extends Service {
  public sentryIntegrations = [libsqlIntegration(libsqlClient, Sentry)];

  protected setup(): void {
    super.setup();
    this.app.route('/', health.createRouter());
    this.app.route('/', profiles.createRouter());
  }
}
