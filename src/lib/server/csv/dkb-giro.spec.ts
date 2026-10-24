import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseDkbGiro, parseGermanDate, tokenize } from './dkb-giro';

const encode = (text: string) => new TextEncoder().encode(text);
const sample = readFileSync(new URL('./fixtures/girokonto.csv', import.meta.url));

const HEADER =
	'"Buchungsdatum";"Wertstellung";"Status";"Zahlungspflichtige*r";"Zahlungsempfänger*in";"Verwendungszweck";"Umsatztyp";"IBAN";"Betrag (€)";"Gläubiger-ID";"Mandatsreferenz";"Kundenreferenz"';
const file = (...rows: string[]) =>
	[
		'"Girokonto";"DE02 1203 0000 0000 2020 51"',
		'""',
		'"Kontostand vom 23.10.2026:";"1.234,56 €"',
		'""',
		HEADER,
		...rows
	].join('\n');
const row = (date: string, amount: string, status = 'Gebucht', payee = 'Bakery') =>
	`"${date}";"${date}";"${status}";"Jane Doe";"${payee}";"Bread";"Ausgang";"DE00";"${amount}";"";"";""`;

describe('tokenize', () => {
	it('handles quotes, escaped quotes and line breaks inside quotes', () => {
		expect(tokenize('"a";"b ""c""";"d\ne"\r\n"f"')).toEqual([
			{ line: 1, cells: ['a', 'b "c"', 'd\ne'] },
			{ line: 3, cells: ['f'] }
		]);
	});
});

describe('parseGermanDate', () => {
	it('reads two- and four-digit years', () => {
		expect(parseGermanDate('23.10.26')).toBe('2026-10-23');
		expect(parseGermanDate('01.02.2025')).toBe('2025-02-01');
	});
	it('rejects impossible dates', () => {
		expect(parseGermanDate('31.02.26')).toBeNull();
		expect(parseGermanDate('2026-10-23')).toBeNull();
	});
});

describe('parseDkbGiro', () => {
	it('parses the example export', () => {
		const result = parseDkbGiro(sample);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const { statement } = result;
		expect(statement.accountKind).toBe('Girokonto');
		expect(statement.balanceDate).toBe('2026-10-23');
		expect(statement.balanceCents).toBe(12345);
		expect(statement.rows).toHaveLength(2);
		expect(statement.rows[0]).toMatchObject({
			bookingDate: '2026-10-23',
			amountCents: -123,
			type: 'Ausgang'
		});
		expect(statement.rejected).toEqual([]);
	});

	it('normalizes the account IBAN', () => {
		const result = parseDkbGiro(encode(file(row('01.10.26', '-1,00'))));
		expect(result.ok && result.statement.iban).toBe('DE02120300000000202051');
	});

	it('keeps identical rows apart and gives re-imports the same fingerprints', () => {
		const text = file(row('01.10.26', '-2,50'), row('01.10.26', '-2,50'));
		const a = parseDkbGiro(encode(text));
		const b = parseDkbGiro(encode(text));
		if (!a.ok || !b.ok) throw new Error('parse failed');
		const prints = a.statement.rows.map((r) => r.fingerprint);
		expect(new Set(prints).size).toBe(2);
		expect(b.statement.rows.map((r) => r.fingerprint)).toEqual(prints);
	});

	it('sets pending rows apart from booked ones', () => {
		const result = parseDkbGiro(
			encode(file(row('02.10.26', '-5,00', 'Vorgemerkt'), row('01.10.26', '-1,00')))
		);
		if (!result.ok) throw new Error('parse failed');
		expect(result.statement.pendingCount).toBe(1);
		expect(result.statement.pending[0]).toMatchObject({
			bookingDate: '2026-10-02',
			amountCents: -500
		});
		expect(result.statement.rows).toHaveLength(1);
	});

	it('rejects rows it cannot read and says why', () => {
		const result = parseDkbGiro(encode(file(row('99.99.26', '-1,00'), row('01.10.26', 'x'))));
		if (!result.ok) throw new Error('parse failed');
		expect(result.statement.rejected.map((r) => r.reason)).toEqual(['bad_date', 'bad_amount']);
	});

	it('names missing columns for an unknown layout', () => {
		const result = parseDkbGiro(encode('"Buchungsdatum";"Betrag (EUR)"\n"01.10.26";"1,00"'));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.code).toBe('unknown_layout');
		expect(result.error.code === 'unknown_layout' && result.error.missing).toContain('Betrag (€)');
	});

	it('fails clearly on empty or binary files', () => {
		expect(parseDkbGiro(new Uint8Array())).toEqual({ ok: false, error: { code: 'empty' } });
		expect(parseDkbGiro(new Uint8Array([0, 1, 2]))).toEqual({
			ok: false,
			error: { code: 'not_text' }
		});
	});

	it('reads Windows-1252 exports', () => {
		const text = file(row('01.10.26', '-1,00', 'Gebucht', 'Bäckerei'));
		// Windows-1252 puts € at 0x80; the other characters here are Latin-1.
		const bytes = Uint8Array.from([...text].map((c) => (c === '€' ? 0x80 : c.charCodeAt(0))));
		const result = parseDkbGiro(bytes);
		if (!result.ok) throw new Error('parse failed');
		expect(result.statement.encoding).toBe('windows-1252');
		expect(result.statement.rows[0].payee).toBe('Bäckerei');
	});
});
