import { Jetstream, type CommitCreateEvent, type CommitUpdateEvent } from "@skyware/jetstream";
import type { Logger } from "pino";
import { actor, base } from '@shutters/lexicons';
import { getDb } from "./db";
import { profiles, type ProfileInsert } from "./db/schema";

const jetstream = new Jetstream({
  wantedCollections: ["social.shutters.*"],
});

export const start = async (logger: Logger) => {
  jetstream.on("commit", (event) => {
    logger.info(
      {
        op: event.commit.operation,
        collection: event.commit.collection,
      },
      "commit processing",
    );

    if (
      event.commit.operation === "create" ||
      event.commit.operation === "update"
    ) {
    } else if (event.commit.operation === "delete") {
    } else {
      logger.info(
        { op: (event.commit as { operation: unknown }).operation },
        "invalid commit op, ignoring",
      );
    }
  });
};

export const ingestProfile = async (
  logger: Logger,
  event: CommitCreateEvent<`social.shutters.actor.profile`> | CommitUpdateEvent<`social.shutters.actor.profile`>
) => {
  if (!actor.isProfile(event.commit.record)) {
    logger.warn({ did: event.did }, 'attempted to index invalid profile');
    return;
  }

  const { record: profile } = event.commit;

  let insert: ProfileInsert = {
    did: base.did.parse(event.did),
    displayName: profile.displayName!,
    description: profile.description,
    avatarCid: profile.avatar ? profile.avatar.ref.$link : null,
    createdAt: profile.createdAt!,
    indexedAt: new Date().toISOString(),
  };
  const update = (({ did, ...insert }) => insert as ProfileInsert)(insert);

  await getDb().insert(profiles)
    .values(insert)
    .onConflictDoUpdate({ ...update });
};
