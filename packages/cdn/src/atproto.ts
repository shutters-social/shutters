import * as atcuteCid from '@atcute/cid';
import * as Sentry from '@sentry/bun';
import {
  getCachedBlobVerification,
  getCachedDidDoc,
  setCachedBlobVerification,
  setCachedDidDoc,
} from './dynamodb';
import { getBlobCached } from './s3';

export type DidDocument = {
  '@context': string[];
  id: string;
  alsoKnownAs?: string[];
  verificationMethod?: {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
  }[];
  service?: { id: string; type: string; serviceEndpoint: string }[];
};

export const fetchDidDocument = async (did: string) =>
  Sentry.startSpan(
    {
      op: 'atproto.fetchDid',
      name: `${did}`,
      attributes: {
        'atproto.did': did,
      },
    },
    async _span => {
      const cachedDidDoc = await getCachedDidDoc(did);
      if (cachedDidDoc) {
        return cachedDidDoc;
      }

      let res: Response;
      if (did.startsWith('did:plc:')) {
        res = await fetch(`https://plc.directory/${did}`);
      } else if (did.startsWith('did:web:')) {
        res = await fetch(
          `https://${did.slice('did:web:'.length)}/.well-known/did.json`,
        );
      } else {
        return null;
      }

      const didDoc = (await res.json()) as DidDocument;

      await setCachedDidDoc(didDoc);
      return didDoc;
    },
  );

export const getPdsUrl = (didDoc: DidDocument) =>
  Sentry.startSpan(
    {
      op: 'atproto.getPdsUrl',
      name: `${didDoc.id}`,
      attributes: {
        'atproto.did': didDoc.id,
      },
    },
    _span => {
      const service = didDoc.service?.find(
        s => s.type === 'AtprotoPersonalDataServer',
      );
      if (!service) return null;
      return service.serviceEndpoint;
    },
  );

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
