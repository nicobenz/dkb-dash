import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { parseDkbGiro } from '#lib/server/csv/dkb-giro.js';
import { listImports, saveDraft } from '#lib/server/imports.js';
import type { Actions, PageServerLoad } from './$types';

const MAX_BYTES = 10 * 1024 * 1024;

export const load = (async () => ({ imports: await listImports() })) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request }) => {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File) || (file.size === 0 && file.name === '')) {
			return fail(400, { error: { code: 'no_file' as const } });
		}
		if (file.size > MAX_BYTES) return fail(400, { error: { code: 'too_large' as const } });

		const result = parseDkbGiro(new Uint8Array(await file.arrayBuffer()));
		if (!result.ok) return fail(400, { error: result.error, filename: file.name });

		const draftId = await saveDraft(file.name, result.statement);
		redirect(303, resolve('/import/[draftId]', { draftId }));
	}
};
