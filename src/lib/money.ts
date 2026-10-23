/**
 * Money is handled as integer cents end to end. These helpers convert the bank's
 * German notation without ever passing through a float.
 */

const GERMAN_AMOUNT = /^([+-])?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;

/** Parses "-1.234,56", "1234,5" or "12" into cents. Returns null when the text is not an amount. */
export function parseGermanAmount(input: string): number | null {
	const text = input.replace(/\s|€/g, '');
	const match = GERMAN_AMOUNT.exec(text);
	if (!match) return null;
	const [, sign, whole, fraction = ''] = match;
	const cents = Number(whole.replaceAll('.', '')) * 100 + Number(fraction.padEnd(2, '0'));
	if (!Number.isSafeInteger(cents)) return null;
	return sign === '-' ? -cents : cents;
}

const MINUS = '−';

/** Formats cents as EUR. `sign: 'always'` prints + for incoming and − for outgoing. */
export function formatCents(
	cents: number,
	{ sign = 'auto', locale = 'en-GB' }: { sign?: 'auto' | 'always' | 'never'; locale?: string } = {}
): string {
	const formatted = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'EUR',
		signDisplay: sign === 'always' ? 'exceptZero' : sign
	}).format(cents / 100);
	return formatted.replace('-', MINUS);
}
