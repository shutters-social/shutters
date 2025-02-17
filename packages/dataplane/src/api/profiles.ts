import { zValidator } from '@hono/zod-validator';
import { base } from '@shutters/lexicons';
import { eq, gt } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '../db';
import { profiles } from '../db/schema';

export const createRouter = () => {
  const router = new Hono();

  router.get('/profiles', zValidator('query', getProfilesRequest), async c => {
    const { cursor, perPage } = c.req.valid('query');
    console.log(cursor);

    const profileSet = await getDb()
      .select()
      .from(profiles)
      .where(gt(profiles.createdAt, cursor.toISOString()))
      .limit(perPage)
      .all();

    return c.json({
      perPage,
      profiles: profileSet,
      next: profileSet.length > 0
        ? profileSet[profileSet.length - 1].indexedAt
        : '1970-01-01T00:00:00Z',
    });
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
  cursor: z.coerce.date().default(new Date(0)),
  perPage: z.coerce.number().min(1).max(100).default(50),
});
