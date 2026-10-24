import { describe, expect, it } from 'vitest';
import { ruleMatches, spendingByTag, tagsFor, type Matchable, type Tag } from './tags';

const booking = (over: Partial<Matchable> = {}): Matchable => ({
	payer: 'Jane Doe',
	payee: 'REWE Markt GmbH',
	purpose: 'VISA Debitkartenumsatz vom 22.10.2026',
	type: 'Ausgang',
	amountCents: -2345,
	counterpartyIban: 'DE02120300000000202051',
	creditorId: '',
	mandateReference: '',
	customerReference: '',
	...over
});

describe('ruleMatches', () => {
	it('matches a contained text ignoring case', () => {
		expect(ruleMatches({ field: 'counterparty', text: 'rewe' }, booking())).toBe(true);
		expect(ruleMatches({ field: 'counterparty', text: 'Lidl' }, booking())).toBe(false);
	});

	it('reads the counterparty as the payee for money out and the payer for money in', () => {
		const rule = { field: 'counterparty' as const, text: 'jane' };
		expect(ruleMatches(rule, booking())).toBe(false);
		expect(ruleMatches(rule, booking({ type: 'Eingang', amountCents: 100 }))).toBe(true);
	});

	it('finds the account holder in any field, which is why the preview matters', () => {
		expect(ruleMatches({ field: 'any', text: 'Jane' }, booking())).toBe(true);
	});

	it('compares IBANs without spaces', () => {
		expect(ruleMatches({ field: 'iban', text: 'de02 1203' }, booking())).toBe(true);
	});

	it('never matches an empty or blank text', () => {
		expect(ruleMatches({ field: 'any', text: '' }, booking())).toBe(false);
		expect(ruleMatches({ field: 'any', text: '   ' }, booking())).toBe(false);
	});
});

const tags: Tag[] = [
	{ id: 1, name: 'Groceries', rules: [{ field: 'counterparty', text: 'REWE' }] },
	{ id: 2, name: 'Card', rules: [{ field: 'purpose', text: 'Debitkartenumsatz' }] },
	{ id: 3, name: 'Rent', rules: [{ field: 'purpose', text: 'Miete' }] }
];

describe('tagsFor', () => {
	it('gives a booking every matching tag with the rule that put it there', () => {
		expect(tagsFor(tags, booking()).map((t) => [t.name, t.rule.text])).toEqual([
			['Groceries', 'REWE'],
			['Card', 'Debitkartenumsatz']
		]);
	});
});

describe('spendingByTag', () => {
	it('counts a booking under each of its tags and reports the overlap', () => {
		const result = spendingByTag(tags, [
			booking(),
			booking({ payee: 'Vermieter', purpose: 'Miete Oktober', amountCents: -80000 }),
			booking({ payee: 'Kiosk', purpose: 'Bar', amountCents: -500 }),
			booking({ type: 'Eingang', amountCents: 300000, purpose: 'Gehalt' })
		]);
		expect(result.outCents).toBe(-82845);
		expect(result.tags.map((t) => [t.name, t.count, t.outCents])).toEqual([
			['Rent', 1, -80000],
			['Card', 1, -2345],
			['Groceries', 1, -2345]
		]);
		expect(result.untagged).toEqual({ count: 1, outCents: -500 });
		expect(result.multiTagged).toBe(1);
	});
});
