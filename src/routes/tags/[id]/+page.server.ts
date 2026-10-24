import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { deleteTag, getTag, previewRules, readTagForm, saveTag } from '#lib/server/tags.js';
import type { Actions, PageServerLoad } from './$types';

const tagId = (param: string) => (/^\d+$/.test(param) ? Number(param) : undefined);

export const load = (async ({ parent, params, url }) => {
	const { currentAccountId } = await parent();
	const id = tagId(params.id);
	const tag = id === undefined ? undefined : await getTag(id);
	if (!tag) return { tag: undefined };
	return {
		tag,
		saved: url.searchParams.has('saved'),
		preview:
			currentAccountId === null ? null : await previewRules(currentAccountId, tag.rules, tag.id)
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	save: async ({ params, request }) => {
		const id = tagId(params.id);
		if (id === undefined || !(await getTag(id))) redirect(303, resolve('/tags'));
		const values = readTagForm(await request.formData());
		const result = await saveTag(id, values);
		if (!result.ok) return fail(400, { error: result.error, values });
		redirect(303, `${resolve('/tags/[id]', { id: String(id) })}?saved=1`);
	},
	delete: async ({ params }) => {
		const id = tagId(params.id);
		const tag = id === undefined ? undefined : await getTag(id);
		if (tag) await deleteTag(tag.id);
		redirect(303, `${resolve('/tags')}${tag ? `?deleted=${encodeURIComponent(tag.name)}` : ''}`);
	}
};
