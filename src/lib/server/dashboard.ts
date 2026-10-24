import { and, asc, between, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { account, importBatch, transaction } from './db/schema';
import { buildLedger, dailyBalances, monthBounds, previousDay, shiftMonth } from '#lib/ledger.js';
import { spendingByTag, tagsFor } from '#lib/tags.js';
import { listTags } from './tags';

export async function listAccounts() {
	return db.select().from(account).orderBy(asc(account.id));
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function getDashboard(accountId: number, requestedMonth: string | null) {
	const [movements, anchors, monthRows] = await Promise.all([
		db
			.select({ bookingDate: transaction.bookingDate, amountCents: transaction.amountCents })
			.from(transaction)
			.where(eq(transaction.accountId, accountId)),
		db
			.select({
				date: importBatch.statementBalanceDate,
				cents: importBatch.statementBalanceCents,
				importId: importBatch.id
			})
			.from(importBatch)
			.where(eq(importBatch.accountId, accountId)),
		db
			.selectDistinct({ month: sql<string>`to_char(${transaction.bookingDate}, 'YYYY-MM')` })
			.from(transaction)
			.where(eq(transaction.accountId, accountId))
	]);

	const ledger = buildLedger(movements, anchors);
	const months = monthRows.map((r) => r.month).sort();
	if (!ledger || months.length === 0) return undefined;

	const latest = months.at(-1)!;
	const month = requestedMonth && MONTH.test(requestedMonth) ? requestedMonth : latest;
	const { first, last } = monthBounds(month);

	const [rows, tags] = await Promise.all([
		db
			.select({
				id: transaction.id,
				bookingDate: transaction.bookingDate,
				payer: transaction.payer,
				payee: transaction.payee,
				purpose: transaction.purpose,
				type: transaction.type,
				counterpartyIban: transaction.counterpartyIban,
				amountCents: transaction.amountCents,
				customerReference: transaction.customerReference,
				mandateReference: transaction.mandateReference,
				creditorId: transaction.creditorId
			})
			.from(transaction)
			.where(
				and(eq(transaction.accountId, accountId), between(transaction.bookingDate, first, last))
			)
			.orderBy(asc(transaction.bookingDate), asc(transaction.id)),
		listTags()
	]);

	const openingCents = ledger.balanceAt(previousDay(first));
	let running = openingCents;
	const transactions = rows.map((row) => ({
		...row,
		balanceCents: (running += row.amountCents),
		tags: tagsFor(tags, row)
	}));

	const inCents = rows.filter((r) => r.amountCents > 0).reduce((s, r) => s + r.amountCents, 0);
	const outCents = rows.filter((r) => r.amountCents < 0).reduce((s, r) => s + r.amountCents, 0);

	// The bank's own balances that fall in this month, latest first: the evidence for the closing figure.
	const evidence = ledger.checks
		.filter((c) => c.anchor.date >= first && c.anchor.date <= last)
		.sort((a, b) => (a.anchor.date < b.anchor.date ? 1 : -1));
	const mismatches = ledger.checks.filter((c) => c.differenceCents !== 0);

	// Never draw history before the first imported transaction: those balances would be invented.
	const earliest = movements.reduce(
		(min, mv) => (mv.bookingDate < min ? mv.bookingDate : min),
		first
	);
	const twelveMonthsBack = monthBounds(shiftMonth(month, -11)).first;
	const chartStart = earliest > twelveMonthsBack ? previousDay(earliest) : twelveMonthsBack;
	const chartEnd = last < ledger.anchor.date ? last : ledger.anchor.date;

	return {
		month,
		months,
		first,
		last,
		openingCents,
		inCents,
		outCents,
		closingCents: ledger.balanceAt(last),
		transactions,
		tagCount: tags.length,
		spending: spendingByTag(tags, rows),
		anchor: ledger.anchor,
		evidence: evidence[0],
		mismatches,
		balances: dailyBalances(ledger, chartStart, chartEnd)
	};
}
