import { describe, expect, it } from 'vitest';
import { formatCents, parseGermanAmount } from './money';

describe('parseGermanAmount', () => {
	it.each([
		['-1,23', -123],
		['123,45 €', 12345],
		['1.234,56', 123456],
		['-12.345.678,9', -1234567890],
		['12', 1200],
		['0,05', 5],
		['+7,10', 710]
	])('parses %s', (input, cents) => {
		expect(parseGermanAmount(input)).toBe(cents);
	});

	it.each(['', 'abc', '1,234', '1.23', '12,345', '1.2345,00', '--1'])('rejects %j', (input) => {
		expect(parseGermanAmount(input)).toBeNull();
	});
});

describe('formatCents', () => {
	it('formats EUR with a true minus', () => {
		expect(formatCents(-123456)).toBe('−€1,234.56');
		expect(formatCents(5)).toBe('€0.05');
	});

	it('prints an explicit sign when asked', () => {
		expect(formatCents(710, { sign: 'always' })).toBe('+€7.10');
		expect(formatCents(-710, { sign: 'always' })).toBe('−€7.10');
		expect(formatCents(-710, { sign: 'never' })).toBe('€7.10');
	});
});
