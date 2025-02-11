import { Service } from '@shutters/shutterkit';
import { health } from './api';

export class ApiService extends Service {
  protected setup() {
    super.setup();

    this.app.route('/', health.createRouter());
  }
}
