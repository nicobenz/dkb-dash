import { getLocale } from '#lib/paraglide/runtime.js';
import { formatCents } from '#lib/money.js';

/** Paraglide locale → the regional locale used for numbers and dates. */
const REGIONAL: Record<string, string> = { en: 'en-GB', de: 'de-DE' };

export const intlLocale = () => REGIONAL[getLocale()] ?? 'en-GB';

export const money = (cents: number, sign: 'auto' | 'always' | 'never' = 'auto') =>
	formatCents(cents, { sign, locale: intlLocale() });

const asUtc = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

/** 23 Oct 2026 */
export const date = (iso: string) =>
	new Intl.DateTimeFormat(intlLocale(), {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(asUtc(iso));

/** 23 Oct */
export const shortDate = (iso: string) =>
	new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
		asUtc(iso)
	);

/** October 2026, from "2026-10" */
export const monthName = (month: string, style: 'long' | 'short' = 'long') =>
	new Intl.DateTimeFormat(intlLocale(), { month: style, year: 'numeric', timeZone: 'UTC' }).format(
		asUtc(`${month}-01`)
	);

export const timestamp = (value: Date | string) =>
	new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
		new Date(value)
	);

/** DE02 1203 0000 0000 2020 51 */
export const iban = (value: string) => value.replace(/(.{4})(?=.)/g, '$1 ');

/** 12 %, or 4.5 % below ten so small shares don't read as zero. */
export const percent = (share: number) =>
	new Intl.NumberFormat(intlLocale(), {
		style: 'percent',
		maximumFractionDigits: share < 0.1 ? 1 : 0
	}).format(share);
