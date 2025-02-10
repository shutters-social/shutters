import * as Sentry from '@sentry/bun';
import { Hono } from "hono";
import { fetchDidDocument, getPdsUrl, pullAndVerifyCid } from '../atproto';
import { isValidPreset } from '../presets';
import { getBlobCached } from '../state';
import { cdnHits } from '../metrics';

export const createRouter = () => {
  const router = new Hono();

  router.get('/:preset/:did/:cid', async c => {
    const { preset, did, cid } = c.req.param();

    Sentry.setContext('cdnValues', {
      preset,
      did,
      cid,
    });

    if (!isValidPreset(preset)) return c.notFound();

    const didDoc = await fetchDidDocument(did);
    if (!didDoc) return c.notFound();

    const pdsUrl = getPdsUrl(didDoc);
    if (!pdsUrl) return c.json({ message: 'Could not resolve PDS URL' }, 400);

    const verified = await pullAndVerifyCid(pdsUrl, did, cid);
    if (!verified) {
      return c.json(
        {
          message: 'PDS blob CID did not match the requested blob CID.',
        },
        400,
      );
    }

    const blobData = await getBlobCached(pdsUrl, did, cid, preset);

    cdnHits.inc({ preset: preset });

    return c.body(blobData.stream(), 200, {
      'Content-Type': blobData.type,
    });
  });

  return router;
};
