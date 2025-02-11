import type { At } from "@atcute/client/lexicons";
import { z } from "zod";

export const did = z.custom<At.DID>(data => {
  if (typeof data !== 'string') return false;
  return data.startsWith('did:') && ['web', 'plc'].includes(data.split(':')[1]);
});

export const blob = z.object({
  $type: z.literal('blob'),
  mimeType: z.string(),
  ref: z.object({
    $link: z.string(),
  }),
  size: z.number(),
});
blob._output satisfies At.Blob;
