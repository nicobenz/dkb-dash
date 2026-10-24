import { describe, expect, it } from 'vitest';
import { buildLedger, dailyBalances, monthBounds, previousDay, shiftMonth } from './ledger';

const movements = [
	{ bookingDate: '2026-09-28', amountCents: 250000 },
	{ bookingDate: '2026-10-01', amountCents: -95000 },
	{ bookingDate: '2026-10-01', amountCents: -1250 },
	{ bookingDate: '2026-10-15', amountCents: -4999 }
];

describe('buildLedger', () => {
	it('returns nothing without a bank balance to anchor on', () => {
		expect(buildLedger(movements, [])).toBeUndefined();
	});

	it('derives balances backwards and forwards from the latest anchor', () => {
		const ledger = buildLedger(movements, [{ date: '2026-10-20', cents: 300000, importId: 1 }])!;
		expect(ledger.balanceAt('2026-10-20')).toBe(300000);
		expect(ledger.balanceAt('2026-10-14')).toBe(304999);
		expect(ledger.balanceAt('2026-09-30')).toBe(401249);
		expect(ledger.balanceAt('2026-09-27')).toBe(151249);
	});

	it('flags an older anchor that the transactions do not reach', () => {
		const ledger = buildLedger(movements, [
			{ date: '2026-09-30', cents: 400000, importId: 1 },
			{ date: '2026-10-20', cents: 300000, importId: 2 }
		])!;
		expect(ledger.anchor.importId).toBe(2);
		expect(ledger.checks.map((c) => c.differenceCents)).toEqual([1249, 0]);
	});
});

describe('date helpers', () => {
	it('finds month bounds, including leap years', () => {
		expect(monthBounds('2028-02')).toEqual({ first: '2028-02-01', last: '2028-02-29' });
		expect(shiftMonth('2026-01', -1)).toBe('2025-12');
		expect(shiftMonth('2026-12', 1)).toBe('2027-01');
		expect(previousDay('2026-03-01')).toBe('2026-02-28');
	});

	it('lists one balance per day', () => {
		const ledger = buildLedger(movements, [{ date: '2026-10-20', cents: 300000, importId: 1 }])!;
		const points = dailyBalances(ledger, '2026-09-30', '2026-10-02');
		expect(points.map((p) => p.cents)).toEqual([401249, 304999, 304999]);
	});
});
