import { zValidator } from '@hono/zod-validator';
import { base } from '@shutters/lexicons';
import { eq } from 'drizzle-orm';
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

  router.get(
    '/profiles/:did',
    zValidator('param', z.object({ did: base.did })),
    async c => {
      const { did } = c.req.valid('param');

      const profile = await getDb()
        .select()
        .from(profiles)
        .where(eq(profiles.did, did))
        .get();

      if (!profile) return c.notFound();

      return c.json({ profile });
    },
  );

  return router;
};

const getProfilesRequest = z.object({
  cursor: z.string().optional(),
});
