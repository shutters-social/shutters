import { Service } from '@shutters/shutterkit';
import { cdnHits } from './metrics';
import { blob, health } from './api';

export class CdnService extends Service {
  protected setup() {
    this.registry.registerMetric(cdnHits);
    super.setup();

    this.app.route("/", health.createRouter());
    this.app.route("/", blob.createRouter());
  }
}
