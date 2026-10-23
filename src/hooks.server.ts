import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
			}
		);
	});

export const handle: Handle = handleParaglide;

const DATABASE_ERRORS = new Set([
	'ECONNREFUSED',
	'ENOTFOUND',
	'EAI_AGAIN',
	'ETIMEDOUT',
	'28P01',
	'3D000'
]);

function isDatabaseError(error: unknown): boolean {
	for (let e = error; e && typeof e === 'object'; e = (e as { cause?: unknown }).cause) {
		if (DATABASE_ERRORS.has(String((e as { code?: unknown }).code))) return true;
		if (e instanceof AggregateError && e.errors.some(isDatabaseError)) return true;
	}
	return false;
}

export const handleError: HandleServerError = ({ kind, error }) => {
	if (kind !== 'unknown') return;
	console.error(error);
	if (isDatabaseError(error)) return { message: 'Database unavailable', code: 'database' };
};
