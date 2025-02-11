import { Service } from '@shutters/shutterkit';
import { blob, health } from './api';
import { cdnHits } from './metrics';

export class CdnService extends Service {
  protected setup() {
    this.registry.registerMetric(cdnHits);
    super.setup();

    this.app.route('/', health.createRouter());
    this.app.route('/', blob.createRouter());
  }
}
