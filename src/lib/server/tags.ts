import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { tag, tagRule, transaction } from './db/schema';
import { isRuleField, ruleMatches, tagsFor, type Rule, type Tag } from '#lib/tags.js';

export const NAME_MAX = 60;
export const TEXT_MAX = 200;
export const RULES_MAX = 50;

export async function listTags(): Promise<Tag[]> {
	const [tags, rules] = await Promise.all([
		db
			.select({ id: tag.id, name: tag.name })
			.from(tag)
			.orderBy(sql`lower(${tag.name})`),
		db
			.select({ tagId: tagRule.tagId, field: tagRule.field, text: tagRule.text })
			.from(tagRule)
			.orderBy(asc(tagRule.tagId), asc(tagRule.position))
	]);
	return tags.map((t) => ({
		...t,
		rules: rules.filter((r) => r.tagId === t.id).map(({ field, text }) => ({ field, text }))
	}));
}

export async function getTag(id: number) {
	return (await listTags()).find((t) => t.id === id);
}

/** Every booking of the account with the strings rules look at, newest first. */
export async function bookingsFor(accountId: number) {
	return db
		.select({
			id: transaction.id,
			bookingDate: transaction.bookingDate,
			payer: transaction.payer,
			payee: transaction.payee,
			purpose: transaction.purpose,
			type: transaction.type,
			amountCents: transaction.amountCents,
			counterpartyIban: transaction.counterpartyIban,
			creditorId: transaction.creditorId,
			mandateReference: transaction.mandateReference,
			customerReference: transaction.customerReference
		})
		.from(transaction)
		.where(eq(transaction.accountId, accountId))
		.orderBy(desc(transaction.bookingDate), desc(transaction.id));
}

export type TagInputError =
	| { code: 'name_empty' }
	| { code: 'name_long' }
	| { code: 'name_taken' }
	| { code: 'rule_empty'; index: number }
	| { code: 'rules_many' };

/** Reads the editor's form: `name`, then repeated `field` / `text` pairs in rule order. */
export function readTagForm(form: FormData) {
	const name = String(form.get('name') ?? '').trim();
	const fields = form.getAll('field');
	const texts = form.getAll('text');
	const rules: Rule[] = fields.map((f, i) => ({
		field: isRuleField(f) ? f : 'any',
		text: String(texts[i] ?? '').trim()
	}));
	return { name, rules };
}

export function validateTag(input: { name: string; rules: Rule[] }): TagInputError | undefined {
	if (!input.name) return { code: 'name_empty' };
	if (input.name.length > NAME_MAX) return { code: 'name_long' };
	if (input.rules.length > RULES_MAX) return { code: 'rules_many' };
	const blank = input.rules.findIndex((r) => !r.text || r.text.length > TEXT_MAX);
	if (blank >= 0) return { code: 'rule_empty', index: blank };
}

const isUniqueViolation = (e: unknown) =>
	typeof e === 'object' &&
	e !== null &&
	((e as { code?: string }).code === '23505' ||
		(e as { cause?: { code?: string } }).cause?.code === '23505');

/** Creates or replaces a tag and its rules. Returns the tag id, or the reason it was refused. */
export async function saveTag(
	id: number | undefined,
	input: { name: string; rules: Rule[] }
): Promise<{ ok: true; id: number } | { ok: false; error: TagInputError }> {
	const invalid = validateTag(input);
	if (invalid) return { ok: false, error: invalid };
	try {
		const savedId = await db.transaction(async (tx) => {
			let tagId = id;
			if (tagId === undefined) {
				[{ id: tagId }] = await tx
					.insert(tag)
					.values({ name: input.name })
					.returning({ id: tag.id });
			} else {
				await tx.update(tag).set({ name: input.name }).where(eq(tag.id, tagId));
				await tx.delete(tagRule).where(eq(tagRule.tagId, tagId));
			}
			if (input.rules.length > 0) {
				await tx
					.insert(tagRule)
					.values(input.rules.map((r, position) => ({ tagId: tagId!, ...r, position })));
			}
			return tagId;
		});
		return { ok: true, id: savedId };
	} catch (e) {
		if (isUniqueViolation(e)) return { ok: false, error: { code: 'name_taken' } };
		throw e;
	}
}

export async function deleteTag(id: number) {
	await db.delete(tag).where(eq(tag.id, id));
}

const PREVIEW_ROWS = 50;

/**
 * What a draft set of rules would catch across the account's whole history: exact counts and
 * totals, a count per rule, and the newest bookings with every tag they would carry.
 */
export async function previewRules(
	accountId: number,
	rules: Rule[],
	editingId: number | undefined
) {
	const [bookings, tags] = await Promise.all([bookingsFor(accountId), listTags()]);
	const others = tags.filter((t) => t.id !== editingId);
	const ruleCounts = rules.map(() => 0);
	let count = 0;
	let inCents = 0;
	let outCents = 0;
	const rows = [];

	for (const b of bookings) {
		let hit = false;
		rules.forEach((r, i) => {
			if (ruleMatches(r, b)) {
				ruleCounts[i] += 1;
				hit = true;
			}
		});
		if (!hit) continue;
		count += 1;
		if (b.amountCents > 0) inCents += b.amountCents;
		else outCents += b.amountCents;
		if (rows.length < PREVIEW_ROWS) {
			rows.push({
				id: b.id,
				bookingDate: b.bookingDate,
				payer: b.payer,
				payee: b.payee,
				purpose: b.purpose,
				type: b.type,
				amountCents: b.amountCents,
				otherTags: tagsFor(others, b).map(({ id, name }) => ({ id, name }))
			});
		}
	}

	return { total: bookings.length, count, inCents, outCents, ruleCounts, rows };
}

export type RulePreview = Awaited<ReturnType<typeof previewRules>>;

/** Each tag with its rule count, its bookings over all history, and money out in the latest month. */
export async function tagsOverview(accountId: number | null) {
	const [tags, bookings] = await Promise.all([
		listTags(),
		accountId === null ? Promise.resolve([]) : bookingsFor(accountId)
	]);
	const month = bookings[0]?.bookingDate.slice(0, 7);
	const rows = tags.map((t) => ({
		id: t.id,
		name: t.name,
		ruleCount: t.rules.length,
		count: 0,
		monthOutCents: 0
	}));
	for (const b of bookings) {
		const inMonth = b.bookingDate.startsWith(month!);
		for (const found of tagsFor(tags, b)) {
			const row = rows.find((r) => r.id === found.id)!;
			row.count += 1;
			if (inMonth && b.amountCents < 0) row.monthOutCents += b.amountCents;
		}
	}
	return { month, bookingCount: bookings.length, tags: rows };
}
