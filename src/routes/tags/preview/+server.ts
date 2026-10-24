import { error, json } from '@sveltejs/kit';
import { isRuleField, type Rule } from '#lib/tags.js';
import { RULES_MAX, previewRules } from '#lib/server/tags.js';
import type { RequestHandler } from './$types';

/** The live match preview: what a draft set of rules would catch, before anything is saved. */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const accountId = Number(body?.accountId);
	const tagId = body?.tagId == null ? undefined : Number(body.tagId);
	if (!Number.isInteger(accountId) || !Array.isArray(body?.rules)) error(400);

	const rules: Rule[] = (body.rules as unknown[]).slice(0, RULES_MAX).map((r) => {
		const { field, text } = (r ?? {}) as Record<string, unknown>;
		return { field: isRuleField(field) ? field : 'any', text: String(text ?? '') };
	});
	return json(await previewRules(accountId, rules, tagId));
};
