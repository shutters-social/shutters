import { Counter } from 'prom-client';

export const cdnHits = new Counter({
  name: 'shutters_cdn_hit',
  help: 'How many times the CDN has returned an image successfully.',
  labelNames: ['preset'],
});
