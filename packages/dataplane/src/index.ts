import { Service } from '@shutters/shutterkit';
import { health } from './api';

export class DataplaneService extends Service {
  protected setup(): void {
    super.setup();
    this.app.route('/', health.createRouter());
  }
}
