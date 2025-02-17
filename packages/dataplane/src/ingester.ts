import { actor, base } from '@shutters/lexicons';
import { type CommitEvent, Jetstream } from '@skyware/jetstream';
import { eq } from 'drizzle-orm';
import type { Logger } from 'pino';
import { getDb } from './db';
import { type ProfileInsert, profiles } from './db/schema';

const jetstream = new Jetstream({
  wantedCollections: ['social.shutters.*'],
});

export const start = async (logger: Logger) => {
  if (!jetstream.ws) return;
  jetstream.ws.binaryType = 'arraybuffer';

  jetstream.on('commit', async event => {
    logger.info(
      {
        op: event.commit.operation,
        collection: event.commit.collection,
      },
      'commit processing',
    );

    switch (event.commit.collection) {
      case 'social.shutters.actor.profile':
        await ingestProfile(logger, event);
        break;
    }
  });

  logger.info('starting ingester');

  jetstream.start();
};

export const ingestProfile = async (
  logger: Logger,
  event: CommitEvent<`social.shutters.actor.profile`>,
) => {
  if (
    event.commit.operation === 'create' ||
    event.commit.operation === 'update'
  ) {
    const { success, data: profile } = actor.profile.safeParse(
      event.commit.record,
    );
    if (!success) {
      logger.warn({ did: event.did }, 'attempted to index invalid profile');
      return;
    }

    const insert: ProfileInsert = {
      did: base.did.parse(event.did),
      displayName: profile.displayName,
      description: profile.description,
      avatarCid: profile.avatar ? profile.avatar.ref.$link : null,
      createdAt: profile.createdAt.toISOString(),
      indexedAt: new Date().toISOString(),
    };
    const update = (({ did, ...insert }) => insert as ProfileInsert)(insert);

    await getDb().insert(profiles).values(insert).onConflictDoUpdate({
      target: profiles.did,
      set: update,
    });

    logger.info({ did: insert.did }, 'profile ingested');
  } else if (event.commit.operation === 'delete') {
    await getDb().delete(profiles).where(eq(profiles.did, event.did)).execute();

    logger.info({ did: event.did }, 'profile deleted');
  }
};
