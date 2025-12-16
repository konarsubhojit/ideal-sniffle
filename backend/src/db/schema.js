import { pgTable, serial, varchar, text, timestamp, integer, decimal, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  googleId: varchar('google_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  picture: text('picture'),
  role: varchar('role', { length: 50 }), // admin, contributor, reader, or null for no access
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login').defaultNow()
});

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  paidBy: integer('paid_by').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  deletedAt: timestamp('deleted_at'), // soft delete
  deletedBy: integer('deleted_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: integer('entity_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow()
});

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  count: integer('count').notNull().default(1), // number of members
  type: varchar('type', { length: 50 }).notNull().default('Internal'), // Internal or External
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const groupMembers = pgTable('group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').references(() => groups.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isPaying: integer('is_paying').notNull().default(1), // 1 for paying member, 0 for non-paying
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
