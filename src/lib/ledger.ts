/**
 * Balances are never stored; they are derived from the bank's own figures. Every import
 * carries the "Kontostand vom" balance at a date (an anchor). The latest anchor is taken
 * as the truth and every other day's balance follows from the booked transactions, so
 * the only way a figure can be wrong is a missing or extra transaction — which the older
 * anchors then expose as a difference.
 */

export type Movement = { bookingDate: string; amountCents: number };
export type Anchor = { date: string; cents: number; importId: number };

export type Ledger = {
	anchor: Anchor;
	/** Balance at the end of `date` (YYYY-MM-DD). */
	balanceAt(date: string): number;
	/** Each anchor next to the balance the ledger derives for its date. */
	checks: { anchor: Anchor; derivedCents: number; differenceCents: number }[];
};

export function buildLedger(movements: Movement[], anchors: Anchor[]): Ledger | undefined {
	if (anchors.length === 0) return undefined;
	const anchor = anchors.reduce((a, b) =>
		b.date > a.date || (b.date === a.date && b.importId > a.importId) ? b : a
	);

	const byDate = new Map<string, number>();
	for (const m of movements)
		byDate.set(m.bookingDate, (byDate.get(m.bookingDate) ?? 0) + m.amountCents);
	const days = [...byDate.keys()].sort();
	const prefix: number[] = [];
	let running = 0;
	for (const day of days) prefix.push((running += byDate.get(day)!));

	/** Sum of all movements booked on or before `date`. */
	const sumThrough = (date: string) => {
		let lo = 0;
		let hi = days.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (days[mid] <= date) lo = mid + 1;
			else hi = mid;
		}
		return lo === 0 ? 0 : prefix[lo - 1];
	};

	const offset = anchor.cents - sumThrough(anchor.date);
	const balanceAt = (date: string) => offset + sumThrough(date);

	const checks = anchors.map((a) => {
		const derivedCents = balanceAt(a.date);
		return { anchor: a, derivedCents, differenceCents: derivedCents - a.cents };
	});

	return { anchor, balanceAt, checks };
}

/** "2026-10" → first and last day of that month. */
export function monthBounds(month: string) {
	const [y, m] = month.split('-').map(Number);
	const first = new Date(Date.UTC(y, m - 1, 1));
	const last = new Date(Date.UTC(y, m, 0));
	return { first: isoDate(first), last: isoDate(last) };
}

export function shiftMonth(month: string, delta: number) {
	const [y, m] = month.split('-').map(Number);
	return isoDate(new Date(Date.UTC(y, m - 1 + delta, 1))).slice(0, 7);
}

export function previousDay(date: string) {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() - 1);
	return isoDate(d);
}

export function isoDate(d: Date) {
	return d.toISOString().slice(0, 10);
}

/** One point per day from `from` to `to`, inclusive. */
export function dailyBalances(ledger: Ledger, from: string, to: string) {
	const points: { date: string; cents: number }[] = [];
	const day = new Date(`${from}T00:00:00Z`);
	const end = new Date(`${to}T00:00:00Z`);
	while (day <= end) {
		const date = isoDate(day);
		points.push({ date, cents: ledger.balanceAt(date) });
		day.setUTCDate(day.getUTCDate() + 1);
	}
	return points;
}
