import { createHash } from 'node:crypto';
import { parseGermanAmount } from '#lib/money.js';

/**
 * Parser for the DKB Girokonto CSV export (the layout in `.csv-export.example`):
 *
 *   "Girokonto";"<IBAN>"
 *   ""
 *   "Kontostand vom 23.10.2026:";"123,45 €"
 *   ""
 *   "Buchungsdatum";"Wertstellung";"Status";…;"Kundenreferenz"
 *   …one row per transaction
 *
 * Columns are found by header name, not position. The parser is pure: it never
 * touches the database, so a preview and a commit see exactly the same rows.
 */

export const REQUIRED_COLUMNS = {
	bookingDate: 'Buchungsdatum',
	valueDate: 'Wertstellung',
	status: 'Status',
	payer: 'Zahlungspflichtige*r',
	payee: 'Zahlungsempfänger*in',
	purpose: 'Verwendungszweck',
	type: 'Umsatztyp',
	counterpartyIban: 'IBAN',
	amount: 'Betrag (€)',
	creditorId: 'Gläubiger-ID',
	mandateReference: 'Mandatsreferenz',
	customerReference: 'Kundenreferenz'
} as const;

type Column = keyof typeof REQUIRED_COLUMNS;

export const BOOKED_STATUS = 'Gebucht';

export type ParsedRow = {
	/** 1-based line number in the file, for messages. */
	line: number;
	bookingDate: string;
	valueDate: string | null;
	status: string;
	payer: string;
	payee: string;
	purpose: string;
	type: string;
	counterpartyIban: string;
	amountCents: number;
	creditorId: string;
	mandateReference: string;
	customerReference: string;
	fingerprint: string;
};

export type PendingRow = Pick<
	ParsedRow,
	'line' | 'bookingDate' | 'payer' | 'payee' | 'purpose' | 'type' | 'amountCents'
>;

export type RejectedRow = {
	line: number;
	reason: 'bad_date' | 'bad_amount' | 'column_count';
	value: string;
};

export type ParsedStatement = {
	accountKind: string;
	iban: string;
	balanceDate: string;
	balanceCents: number;
	/** Booked rows only, in file order. */
	rows: ParsedRow[];
	/** Rows the bank still marks as pending ("Vorgemerkt"); shown in the preview, never stored. */
	pendingCount: number;
	pending: PendingRow[];
	rejected: RejectedRow[];
	encoding: 'utf-8' | 'windows-1252';
};

export type ParseFailure =
	| { code: 'empty' }
	| { code: 'not_text' }
	| { code: 'no_account_line' }
	| { code: 'no_balance_line' }
	| { code: 'unknown_layout'; missing: string[] };

export type ParseResult =
	{ ok: true; statement: ParsedStatement } | { ok: false; error: ParseFailure };

// Windows-1252 differs from Latin-1 only in 0x80–0x9F. Node's built-in decoder may treat the
// two as the same (small-ICU builds), which would lose the € sign, so map that range here.
const CP1252_HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ';

/** Decodes the upload. Current exports are UTF-8; older ones were Windows-1252. */
export function decode(bytes: Uint8Array): { text: string; encoding: ParsedStatement['encoding'] } {
	try {
		const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
		return { text, encoding: 'utf-8' };
	} catch {
		let text = '';
		for (const byte of bytes) {
			text += byte >= 0x80 && byte <= 0x9f ? CP1252_HIGH[byte - 0x80] : String.fromCharCode(byte);
		}
		return { text, encoding: 'windows-1252' };
	}
}

/** Splits `;`-separated, `"`-quoted CSV into records. Handles "" escapes and line breaks inside quotes. */
export function tokenize(text: string): { line: number; cells: string[] }[] {
	const records: { line: number; cells: string[] }[] = [];
	let cells: string[] = [];
	let cell = '';
	let quoted = false;
	let line = 1;
	let recordLine = 1;

	const endRecord = () => {
		cells.push(cell);
		records.push({ line: recordLine, cells });
		cells = [];
		cell = '';
	};

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (quoted) {
			if (char === '"') {
				if (text[i + 1] === '"') {
					cell += '"';
					i++;
				} else {
					quoted = false;
				}
			} else {
				if (char === '\n') line++;
				cell += char;
			}
			continue;
		}
		if (char === '"') quoted = true;
		else if (char === ';') {
			cells.push(cell);
			cell = '';
		} else if (char === '\r') continue;
		else if (char === '\n') {
			endRecord();
			line++;
			recordLine = line;
		} else cell += char;
	}
	if (cell !== '' || cells.length > 0) endRecord();
	return records;
}

/** "23.10.26" or "23.10.2026" → "2026-10-23"; null when it is not a real date. */
export function parseGermanDate(input: string): string | null {
	const match = /^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/.exec(input.trim());
	if (!match) return null;
	const [, dd, mm, yy] = match;
	const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
	const date = new Date(Date.UTC(year, Number(mm) - 1, Number(dd)));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== Number(mm) - 1) return null;
	return date.toISOString().slice(0, 10);
}

const isBlank = (cells: string[]) => cells.every((c) => c.trim() === '');

/**
 * Identity of a booked row: its normalized fields plus how many identical rows came
 * before it in the same file. Two identical coffees on one day stay two rows, and the
 * same export imported twice maps onto the same fingerprints.
 */
function fingerprintOf(fields: string[], occurrence: number) {
	return createHash('sha256')
		.update(JSON.stringify([...fields, occurrence]))
		.digest('hex')
		.slice(0, 32);
}

export function parseDkbGiro(bytes: Uint8Array): ParseResult {
	if (bytes.length === 0) return { ok: false, error: { code: 'empty' } };
	const { text, encoding } = decode(bytes);
	if (text.includes('\u0000')) return { ok: false, error: { code: 'not_text' } };

	const records = tokenize(text.replace(/^\uFEFF/, '')).filter((r) => !isBlank(r.cells));
	if (records.length === 0) return { ok: false, error: { code: 'empty' } };

	const headerIndex = records.findIndex((r) => r.cells.includes(REQUIRED_COLUMNS.bookingDate));
	if (headerIndex === -1) {
		return {
			ok: false,
			error: { code: 'unknown_layout', missing: Object.values(REQUIRED_COLUMNS) }
		};
	}
	const header = records[headerIndex].cells.map((c) => c.trim());
	const missing = Object.values(REQUIRED_COLUMNS).filter((name) => !header.includes(name));
	if (missing.length > 0) return { ok: false, error: { code: 'unknown_layout', missing } };

	const preamble = records.slice(0, headerIndex);
	const accountLine = preamble.find((r) => r.cells.length >= 2 && r.cells[1].trim() !== '');
	const balanceLine = preamble.find((r) => /^Kontostand vom/.test(r.cells[0].trim()));
	if (!accountLine || accountLine === balanceLine)
		return { ok: false, error: { code: 'no_account_line' } };

	const balanceDate = parseGermanDate(
		/Kontostand vom\s+([\d.]+)/.exec(balanceLine?.cells[0] ?? '')?.[1] ?? ''
	);
	const balanceCents = parseGermanAmount(balanceLine?.cells[1] ?? '');
	if (!balanceDate || balanceCents === null)
		return { ok: false, error: { code: 'no_balance_line' } };

	const index = Object.fromEntries(
		Object.entries(REQUIRED_COLUMNS).map(([key, name]) => [key, header.indexOf(name)])
	) as Record<Column, number>;

	const rows: ParsedRow[] = [];
	const rejected: RejectedRow[] = [];
	const seen = new Map<string, number>();
	const pending: PendingRow[] = [];

	for (const { line, cells } of records.slice(headerIndex + 1)) {
		if (cells.length !== header.length) {
			rejected.push({ line, reason: 'column_count', value: String(cells.length) });
			continue;
		}
		const get = (column: Column) => cells[index[column]].trim();

		if (get('status') !== BOOKED_STATUS) {
			pending.push({
				line,
				// Pending rows may lack a booking date; the value date is the next best thing.
				bookingDate: parseGermanDate(get('bookingDate')) ?? parseGermanDate(get('valueDate')) ?? '',
				payer: get('payer'),
				payee: get('payee'),
				purpose: get('purpose'),
				type: get('type'),
				amountCents: parseGermanAmount(get('amount')) ?? 0
			});
			continue;
		}
		const bookingDate = parseGermanDate(get('bookingDate'));
		if (!bookingDate) {
			rejected.push({ line, reason: 'bad_date', value: get('bookingDate') });
			continue;
		}
		const amountCents = parseGermanAmount(get('amount'));
		if (amountCents === null) {
			rejected.push({ line, reason: 'bad_amount', value: get('amount') });
			continue;
		}
		const valueDate = parseGermanDate(get('valueDate'));

		const fields = [
			bookingDate,
			valueDate ?? '',
			get('payer'),
			get('payee'),
			get('purpose'),
			get('type'),
			get('counterpartyIban').replace(/\s/g, ''),
			String(amountCents),
			get('creditorId'),
			get('mandateReference'),
			get('customerReference')
		];
		const key = JSON.stringify(fields);
		const occurrence = seen.get(key) ?? 0;
		seen.set(key, occurrence + 1);

		rows.push({
			line,
			bookingDate,
			valueDate,
			status: get('status'),
			payer: get('payer'),
			payee: get('payee'),
			purpose: get('purpose'),
			type: get('type'),
			counterpartyIban: fields[6],
			amountCents,
			creditorId: get('creditorId'),
			mandateReference: get('mandateReference'),
			customerReference: get('customerReference'),
			fingerprint: fingerprintOf(fields, occurrence)
		});
	}

	return {
		ok: true,
		statement: {
			accountKind: accountLine.cells[0].trim(),
			iban: accountLine.cells[1].replace(/\s/g, '').toUpperCase(),
			balanceDate,
			balanceCents,
			rows,
			pendingCount: pending.length,
			pending,
			rejected,
			encoding
		}
	};
}
