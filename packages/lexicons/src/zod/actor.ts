import { z } from "zod";
import { base } from ".";
import type { SocialShuttersActorProfile } from "@atcute/client/lexicons";

export const profile = z.object({
  displayName: z.string().max(640),
  description: z.string().max(2560),
  avatar: base.blob,
  createdAt: z.coerce.date(),
});

export const isProfile = (
  val: any,
): val is SocialShuttersActorProfile.Record => {
  return profile.safeParse(val).success;
};
