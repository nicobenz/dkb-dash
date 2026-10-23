import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { db } from './db';
import { account, importBatch, importDraft, transaction } from './db/schema';
import type { ParsedStatement } from './csv/dkb-giro';

const DRAFT_LIFETIME_MS = 24 * 60 * 60 * 1000;

export async function saveDraft(filename: string, parsed: ParsedStatement) {
	await db
		.delete(importDraft)
		.where(lt(importDraft.createdAt, new Date(Date.now() - DRAFT_LIFETIME_MS)));
	const [draft] = await db
		.insert(importDraft)
		.values({ filename, parsed })
		.returning({ id: importDraft.id });
	return draft.id;
}

export async function getDraft(id: string) {
	if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
	const [draft] = await db.select().from(importDraft).where(eq(importDraft.id, id));
	return draft;
}

export async function discardDraft(id: string) {
	await db.delete(importDraft).where(eq(importDraft.id, id));
}

/** Fingerprints of `parsed` that the account already holds. */
async function existingFingerprints(accountId: number | undefined, parsed: ParsedStatement) {
	if (accountId === undefined || parsed.rows.length === 0) return new Set<string>();
	const found = new Set<string>();
	const prints = parsed.rows.map((r) => r.fingerprint);
	for (let i = 0; i < prints.length; i += 1000) {
		const rows = await db
			.select({ fingerprint: transaction.fingerprint })
			.from(transaction)
			.where(
				and(
					eq(transaction.accountId, accountId),
					inArray(transaction.fingerprint, prints.slice(i, i + 1000))
				)
			);
		for (const row of rows) found.add(row.fingerprint);
	}
	return found;
}

export type ImportPreview = {
	newRows: ParsedStatement['rows'];
	duplicateRows: ParsedStatement['rows'];
	duplicateCount: number;
	/** The account the file belongs to, when it already exists. */
	existingAccount: { id: number; iban: string } | undefined;
	/** Other accounts that exist; non-empty with no `existingAccount` means the file adds an account. */
	otherAccountCount: number;
};

export async function previewImport(parsed: ParsedStatement): Promise<ImportPreview> {
	const accounts = await db.select({ id: account.id, iban: account.iban }).from(account);
	const existingAccount = accounts.find((a) => a.iban === parsed.iban);
	const known = await existingFingerprints(existingAccount?.id, parsed);
	return {
		newRows: parsed.rows.filter((r) => !known.has(r.fingerprint)),
		duplicateRows: parsed.rows.filter((r) => known.has(r.fingerprint)),
		duplicateCount: known.size,
		existingAccount,
		otherAccountCount: accounts.length - (existingAccount ? 1 : 0)
	};
}

/** Writes a confirmed draft. Rows already present are skipped by their fingerprint. */
export async function commitDraft(draftId: string) {
	const draft = await getDraft(draftId);
	if (!draft) return undefined;
	const parsed = draft.parsed;

	return db.transaction(async (tx) => {
		const [acct] = await tx
			.insert(account)
			.values({ iban: parsed.iban, kind: parsed.accountKind })
			.onConflictDoUpdate({ target: account.iban, set: { kind: parsed.accountKind } })
			.returning({ id: account.id });

		const dates = parsed.rows.map((r) => r.bookingDate).sort();
		const [batch] = await tx
			.insert(importBatch)
			.values({
				accountId: acct.id,
				filename: draft.filename,
				statementBalanceCents: parsed.balanceCents,
				statementBalanceDate: parsed.balanceDate,
				firstBookingDate: dates[0] ?? null,
				lastBookingDate: dates.at(-1) ?? null,
				addedCount: 0,
				duplicateCount: 0,
				pendingCount: parsed.pendingCount
			})
			.returning({ id: importBatch.id });

		let added = 0;
		for (let i = 0; i < parsed.rows.length; i += 500) {
			const inserted = await tx
				.insert(transaction)
				.values(
					parsed.rows.slice(i, i + 500).map((row) => ({
						bookingDate: row.bookingDate,
						valueDate: row.valueDate,
						status: row.status,
						payer: row.payer,
						payee: row.payee,
						purpose: row.purpose,
						type: row.type,
						counterpartyIban: row.counterpartyIban,
						amountCents: row.amountCents,
						creditorId: row.creditorId,
						mandateReference: row.mandateReference,
						customerReference: row.customerReference,
						fingerprint: row.fingerprint,
						accountId: acct.id,
						importId: batch.id
					}))
				)
				.onConflictDoNothing({ target: [transaction.accountId, transaction.fingerprint] })
				.returning({ id: transaction.id });
			added += inserted.length;
		}

		await tx
			.update(importBatch)
			.set({ addedCount: added, duplicateCount: parsed.rows.length - added })
			.where(eq(importBatch.id, batch.id));
		await tx.delete(importDraft).where(eq(importDraft.id, draftId));

		return { importId: batch.id, accountId: acct.id };
	});
}

export async function getImport(id: number) {
	const [row] = await db
		.select({ batch: importBatch, iban: account.iban })
		.from(importBatch)
		.innerJoin(account, eq(account.id, importBatch.accountId))
		.where(eq(importBatch.id, id));
	return row;
}

export async function listImports(limit = 20) {
	return db
		.select({ batch: importBatch, iban: account.iban })
		.from(importBatch)
		.innerJoin(account, eq(account.id, importBatch.accountId))
		.orderBy(desc(importBatch.importedAt))
		.limit(limit);
}
