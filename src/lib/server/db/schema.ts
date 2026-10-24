import {
	pgTable,
	serial,
	integer,
	bigint,
	text,
	date,
	timestamp,
	jsonb,
	uuid,
	uniqueIndex,
	index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { ParsedStatement } from '../csv/dkb-giro';
import type { RuleField } from '../../tags';

export const account = pgTable('account', {
	id: serial('id').primaryKey(),
	iban: text('iban').notNull().unique(),
	/** The account type as the export names it, e.g. "Girokonto". */
	kind: text('kind').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const importBatch = pgTable('import', {
	id: serial('id').primaryKey(),
	accountId: integer('account_id')
		.notNull()
		.references(() => account.id),
	filename: text('filename').notNull(),
	importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
	/** The bank's own balance from the export's "Kontostand vom" line. */
	statementBalanceCents: bigint('statement_balance_cents', { mode: 'number' }).notNull(),
	statementBalanceDate: date('statement_balance_date', { mode: 'string' }).notNull(),
	firstBookingDate: date('first_booking_date', { mode: 'string' }),
	lastBookingDate: date('last_booking_date', { mode: 'string' }),
	addedCount: integer('added_count').notNull(),
	duplicateCount: integer('duplicate_count').notNull(),
	pendingCount: integer('pending_count').notNull()
});

export const transaction = pgTable(
	'transaction',
	{
		id: serial('id').primaryKey(),
		accountId: integer('account_id')
			.notNull()
			.references(() => account.id),
		importId: integer('import_id')
			.notNull()
			.references(() => importBatch.id),
		bookingDate: date('booking_date', { mode: 'string' }).notNull(),
		valueDate: date('value_date', { mode: 'string' }),
		/** Raw status from the export; only booked ("Gebucht") rows are stored. */
		status: text('status').notNull(),
		payer: text('payer').notNull(),
		payee: text('payee').notNull(),
		purpose: text('purpose').notNull(),
		/** Raw type from the export: "Eingang" or "Ausgang". */
		type: text('type').notNull(),
		counterpartyIban: text('counterparty_iban').notNull(),
		amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
		creditorId: text('creditor_id').notNull(),
		mandateReference: text('mandate_reference').notNull(),
		customerReference: text('customer_reference').notNull(),
		fingerprint: text('fingerprint').notNull()
	},
	(t) => [
		uniqueIndex('transaction_account_fingerprint').on(t.accountId, t.fingerprint),
		index('transaction_account_booking_date').on(t.accountId, t.bookingDate)
	]
);

/** A parsed upload waiting for the user to confirm it. Nothing reaches `transaction` before that. */
export const importDraft = pgTable('import_draft', {
	id: uuid('id').primaryKey().defaultRandom(),
	filename: text('filename').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	parsed: jsonb('parsed').$type<ParsedStatement>().notNull()
});

/** A user-defined tag. A booking carries every tag that has a matching rule; nothing is stored per booking. */
export const tag = pgTable(
	'tag',
	{
		id: serial('id').primaryKey(),
		name: text('name').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [uniqueIndex('tag_name_lower').on(sql`lower(${t.name})`)]
);

/** "<field> contains <text>", case-insensitive. A tag matches when any one of its rules does. */
export const tagRule = pgTable(
	'tag_rule',
	{
		id: serial('id').primaryKey(),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' }),
		field: text('field').$type<RuleField>().notNull(),
		text: text('text').notNull(),
		position: integer('position').notNull()
	},
	(t) => [index('tag_rule_tag').on(t.tagId)]
);
