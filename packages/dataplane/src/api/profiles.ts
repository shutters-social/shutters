import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

export const createRouter = () => {
  const router = new Hono();

  router.get('/profiles', zValidator('query', getProfilesRequest), async c => {
    const { cursor } = c.req.valid('query');

    return c.json({ cursor });
  });

  return router;
};

const getProfilesRequest = z.object({
  cursor: z.string().optional(),
});
