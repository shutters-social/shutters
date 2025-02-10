import * as Sentry from '@sentry/bun';
import { type Preset, presets } from './presets';

const wsrvUrl = 'https://wsrv.nl' as const;

export const getBlob = (
  pdsUrl: string,
  did: string,
  cid: string,
  preset: Preset,
) =>
  Sentry.startSpan(
    {
      op: 'http.client',
      name: `GET ${pdsUrl}/xrpc/com.atproto.sync.getBlob`,
      attributes: {
        'http.request.method': 'GET',
      },
    },
    async span => {
      const pdsBlobUrl = new URL('/xrpc/com.atproto.sync.getBlob', pdsUrl);
      pdsBlobUrl.searchParams.set('did', did);
      pdsBlobUrl.searchParams.set('cid', cid);

      let url: URL;
      if (preset === 'raw') {
        url = pdsBlobUrl;
      } else {
        const presetConf = presets[preset];

        url = new URL('/', wsrvUrl);
        url.searchParams.set('url', pdsBlobUrl.toString());
        for (const key of Object.keys(presetConf)) {
          url.searchParams.set(key, presetConf[key].toString());
        }
      }

      Sentry.updateSpanName(span, `GET ${url.toString()}`);
      span.setAttribute('server.address', url.hostname);
      span.setAttribute('server.port', url.port);

      const request = new Request(url);
      const response = await fetch(request);

      span.setAttribute('http.response.status_code', response.status);
      span.setAttribute(
        'http.response_content_length',
        Number(response.headers.get('content-length')),
      );

      return response;
    },
  );
