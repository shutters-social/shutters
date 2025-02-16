import * as Sentry from '@sentry/bun';
import type { Integration } from '@sentry/core';
import type { Env, Handler, Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { Schema } from 'hono/types';
import {
  extractQueryParamsFromUrl,
  getSanitizedUrlString,
  parseUrl,
} from './utils';

declare module 'hono' {
  interface ContextVariableMap {
    span: Sentry.Span;
  }
}

export const sentry: Handler = createMiddleware(async (c, next) => {
  return await Sentry.startSpan(
    {
      op: 'http.server',
      name: `${c.req.method} ${c.req.url}`,
      attributes: {
        'sentry.origin': 'auto.http.hono',
        'sentry.source': 'url',
        'http.request.method': c.req.method,
        'http.request.path': c.req.routePath,
      },
    },
    async span => {
      const url = getSanitizedUrlString(parseUrl(c.req.url));
      Sentry.getIsolationScope().setSDKProcessingMetadata({
        normalizedRequest: {
          url,
          method: c.req.method,
          headers: c.req.header(),
          query_string: extractQueryParamsFromUrl(url),
        } satisfies Sentry.RequestEventData,
        request: c.req.raw,
      });

      await next();

      Sentry.updateSpanName(span, `${c.req.method} ${c.req.routePath}`);

      span.setAttribute('http.response.status_code', c.res.status);
      if (c.error) {
        Sentry.captureException(c.error, {
          mechanism: {
            type: 'middleware',
            handled: false,
          },
        });
      }
    },
  );
});

export const setupHonoSentry = <
  E extends Env,
  S extends Schema,
  B extends string,
>(
  app: Hono<E, S, B>,
  integrations: Integration[],
) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV ?? 'unknown',
    release: process.env.APP_REVISION,
    sampleRate: Number.parseFloat(process.env.SENTRY_SAMPLE_RATE ?? '1.0'),
    tracesSampleRate: Number.parseFloat(process.env.SENTRY_SAMPLE_RATE ?? '1.0'),
    integrations: [
      // Common
      Sentry.inboundFiltersIntegration(),
      Sentry.functionToStringIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.requestDataIntegration(),
      // Native Wrappers
      Sentry.consoleIntegration(),
      Sentry.httpIntegration(),
      Sentry.nativeNodeFetchIntegration(),
      // Global Handlers
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
      // Event Info
      Sentry.contextLinesIntegration(),
      Sentry.nodeContextIntegration(),
      Sentry.modulesIntegration(),

      ...integrations,
    ],
    defaultIntegrations: false,
  });

  app.use(sentry);
};
