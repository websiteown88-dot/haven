import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const analyticsEvents = sqliteTable('analytics_events', {
 id:text('id').primaryKey(), session:text('session').notNull(), kind:text('kind').notNull(), target:text('target').notNull(),
 seconds:integer('seconds').notNull().default(0), depth:integer('depth').notNull().default(0),
 source:text('source').notNull(), device:text('device').notNull(), createdAt:integer('created_at').notNull(), seq:integer('seq').notNull().default(0), version:integer('version').notNull().default(1)
},t=>[index('analytics_created_idx').on(t.createdAt),index('analytics_session_idx').on(t.session)]);
