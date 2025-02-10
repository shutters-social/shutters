import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as Sentry from '@sentry/bun';
import { getBlob } from './blob';
import type { Preset } from './presets';

const client = new S3Client({
  region: process.env.AWS_REGION ?? 'eu-west-2',
});

const BLOB_CACHE_BUCKET = process.env.AWS_BLOB_CACHE_BUCKET;

export const getBlobCached = async (
  pdsUrl: string,
  did: string,
  cid: string,
  preset: Preset,
) => {
  const existing = await getCachedBlob(did, cid, preset);
  if (existing) return existing;

  const blobResp = await getBlob(pdsUrl, did, cid, preset);

  const blobData = await blobResp.blob();

  const cmd = new PutObjectCommand({
    Bucket: BLOB_CACHE_BUCKET,
    Key: `${preset}/${did}/${cid}`,
    Body: await blobData.bytes(),
    Metadata: {
      'Content-Type': blobData.type,
    },
  });
  await client.send(cmd);

  return blobData;
};

export const putCachedBlob = async (
  did: string,
  cid: string,
  preset: Preset,
  blob: Blob,
) =>
  Sentry.startSpan(
    {
      op: 'cache.put',
      name: `${preset}/${did}/${cid}`,
      attributes: {
        'cache.key': `${preset}/${did}/${cid}`,
        'cache.item_size': blob.length,
      },
    },
    async _span => {
      const cmd = new PutObjectCommand({
        Bucket: BLOB_CACHE_BUCKET,
        Key: `${preset}/${did}/${cid}`,
        Body: await blob.bytes(),
        Metadata: {
          'Content-Type': blob.type,
        },
      });
      await client.send(cmd);
    },
  );

export const getCachedBlob = async (did: string, cid: string, preset: Preset) =>
  Sentry.startSpan(
    {
      op: 'cache.get',
      name: `${preset}/${did}/${cid}`,
      attributes: {
        'cache.key': `${preset}/${did}/${cid}`,
      },
    },
    async span => {
      try {
        const cmd = new GetObjectCommand({
          Bucket: BLOB_CACHE_BUCKET,
          Key: `${preset}/${did}/${cid}`,
        });
        const res = await client.send(cmd);
        if (!res.Body || !res.Metadata) return null;

        const bytes = await res.Body.transformToByteArray();

        span.setAttribute('cache.hit', true);
        span.setAttribute('cache.item_size', bytes.byteLength);

        return new Blob([bytes], { type: res.Metadata['content-type'] });
      } catch (err) {
        if (err instanceof NoSuchKey) {
          span.setAttribute('cache.hit', false);
          return null;
        }
        throw err;
      }
    },
  );
