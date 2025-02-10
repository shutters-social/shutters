import * as Sentry from '@sentry/bun';
import { getCachedDidDoc, setCachedDidDoc } from '../state';

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
