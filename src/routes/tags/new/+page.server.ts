import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { previewRules, readTagForm, saveTag } from '#lib/server/tags.js';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
	const { currentAccountId } = await parent();
	return {
		preview: currentAccountId === null ? null : await previewRules(currentAccountId, [], undefined)
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request }) => {
		const values = readTagForm(await request.formData());
		const result = await saveTag(undefined, values);
		if (!result.ok) return fail(400, { error: result.error, values });
		redirect(303, `${resolve('/tags/[id]', { id: String(result.id) })}?saved=1`);
	}
};
