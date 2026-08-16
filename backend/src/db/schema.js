import { boolean, decimal, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  googleId: varchar('google_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  picture: text('picture'),
  role: varchar('role', { length: 50 }), // admin, contributor, reader, or null for no access
  digestOptOut: boolean('digest_opt_out').notNull().default(false),
  settlementGroupId: integer('settlement_group_id'),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login').defaultNow()
});

export const receipts = pgTable('receipts', {
  id: serial('id').primaryKey(),
  expenseId: integer('expense_id').references(() => expenses.id, { onDelete: 'cascade' }).notNull(),
  objectKey: text('object_key').unique().notNull(),
  originalName: text('original_name').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const digestDeliveries = pgTable('digest_deliveries', {
  id: serial('id').primaryKey(),
  period: varchar('period', { length: 7 }).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, table => [
  uniqueIndex('digest_deliveries_period_user_idx').on(table.period, table.userId),
]);

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
  excludeFromAllHeadcount: integer('exclude_from_all_headcount').notNull().default(0), // 1 to exclude from all expense calculations (both internal & external)
  excludeFromInternalHeadcount: integer('exclude_from_internal_headcount').notNull().default(0), // 1 to exclude from internal family calculations only
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
