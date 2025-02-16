import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { profiles } from '../db/schema';

export const createRouter = () => {
  const router = new Hono();

  router.get('/profiles', zValidator('query', getProfilesRequest), async c => {
    const { cursor } = c.req.valid('query');

    const profileSet = await getDb().select().from(profiles).all();

    return c.json({ profileSet, cursor });
  });

  return router;
};

const getProfilesRequest = z.object({
  cursor: z.string().optional(),
});
