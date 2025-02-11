import { Hono } from 'hono';

export const createRouter = () => {
  const router = new Hono();

  router.get('/', c => {
    return c.text(`
     _           _   _
 ___| |__  _   _| |_| |_ ___ _ __ ___
/ __| '_ \\| | | | __| __/ _ \ '__/ __|
\\__ \\ | | | |_| | |_| ||  __/ |  \\__ \\
|___/_| |_|\\__,_|\\__|\\__\\___|_|  |___/

This is an AT Protocol Application View (AppView) for the "shutters.social" application.

Most API routes are under /xrpc/

      Code: https://github.com/shutters-social
  Protocol: https://atproto.com
`);
  });

  router.get('/robots.txt', c =>
    c.text('# Hello there dear stranger!\n\nUser-Agent: *\nAllow: /'),
  );

  router.get('/xrpc/_health', c => {
    return c.json({ ok: true });
  });

  return router;
};
