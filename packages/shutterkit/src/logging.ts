import { createMiddleware } from 'hono/factory';
import pino, { type Logger } from 'pino';

export const newLogger = (name: string) => pino({ name });

export const logMiddleware = <A extends string, B extends boolean>(
  logger: Logger<A, B>,
) =>
  createMiddleware(async (ctx, next) => {
    logger.info({
      event: 'http.request',
      method: ctx.req.method,
      path: ctx.req.path,
      headers: ctx.req.header(),
      requestId: ctx.get('requestId'),
    }, 'request received');

    await next();

    logger.info({
      event: 'http.response',
      method: ctx.req.method,
      path: ctx.req.path,
      headers: ctx.res.headers,
      status: ctx.res.status,
      requestId: ctx.get('requestId'),
      error: !!ctx.error,
    }, 'response returned');
  });
