import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

const didField = (name: string) => text(name).$type<`did:${string}`>();
//const uriField = (name: string) => text(name).$type<`at://${string}`>();

export const profiles = sqliteTable('profiles', {
  did: didField('did').primaryKey(),
  displayName: text('display_name', { length: 640 }).notNull(),
  description: text('description', { length: 2560 }),
  avatarCid: text('avatar_cid'),
  createdAt: text('created_at').notNull(),
  indexedAt: text('indexed_at').default(sql`(CURRENT_TIMESTAMP)`),
});
