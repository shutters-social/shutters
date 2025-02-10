import * as atcuteCid from '@atcute/cid';
import * as Sentry from '@sentry/bun';
import {
  getBlobCached,
  getCachedBlobVerification,
  setCachedBlobVerification,
} from '../state';

export const verifyCid = async (cid: string, blob: Blob) =>
  Sentry.startSpan(
    {
      op: 'atproto.verifyCid',
      name: `${cid}`,
      attributes: {
        'atproto.cid': cid,
      },
    },
    async _span => {
      const strCid = atcuteCid.fromString(cid);
      const blobCid = await atcuteCid.create(
        strCid.codec as 85 | 113,
        await blob.bytes(),
      );

      return JSON.stringify(strCid) === JSON.stringify(blobCid);
    },
  );

export const pullAndVerifyCid = async (
  pdsUrl: string,
  did: string,
  cid: string,
) =>
  Sentry.startSpan(
    {
      op: 'atproto.pullAndVerifyCid',
      name: `${did}/${cid}`,
      attributes: {
        'atproto.did': did,
        'atproto.cid': cid,
      },
    },
    async _span => {
      const cachedVerify = await getCachedBlobVerification(pdsUrl, did, cid);
      if (cachedVerify) {
        return cachedVerify;
      }

      const blobData = await getBlobCached(pdsUrl, did, cid, 'raw');
      const verified = await verifyCid(cid, blobData);
      await setCachedBlobVerification(pdsUrl, did, cid, verified);
      return verified;
    },
  );
