import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { commitDraft, discardDraft, getDraft, previewImport } from '#lib/server/imports.js';
import type { PendingRow } from '#lib/server/csv/dkb-giro.js';
import type { Actions, PageServerLoad } from './$types';

/** The fields the preview shows, newest first. */
const forPreview = (rows: PendingRow[]) =>
	rows
		.map(({ line, bookingDate, payer, payee, purpose, type, amountCents }) => ({
			line,
			bookingDate,
			payer,
			payee,
			purpose,
			type,
			amountCents
		}))
		.toSorted((a, b) =>
			a.bookingDate < b.bookingDate ? 1 : a.bookingDate > b.bookingDate ? -1 : 0
		);

export const load = (async ({ params }) => {
	const draft = await getDraft(params.draftId);
	if (!draft) return { draft: undefined };

	const { parsed } = draft;
	const preview = await previewImport(parsed);
	return {
		draft: {
			filename: draft.filename,
			iban: parsed.iban,
			accountKind: parsed.accountKind,
			balanceDate: parsed.balanceDate,
			balanceCents: parsed.balanceCents,
			rejected: parsed.rejected,
			encoding: parsed.encoding,
			addsAccount: !preview.existingAccount && preview.otherAccountCount > 0,
			newRows: forPreview(preview.newRows),
			duplicateRows: forPreview(preview.duplicateRows),
			// Drafts saved before pending rows were kept only carry the count.
			pendingRows: forPreview(parsed.pending ?? []),
			pendingCount: parsed.pendingCount
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	confirm: async ({ params }) => {
		const result = await commitDraft(params.draftId);
		if (!result) redirect(303, resolve('/import/[draftId]', { draftId: params.draftId }));
		redirect(303, `${resolve('/')}?account=${result.accountId}&imported=${result.importId}`);
	},
	discard: async ({ params }) => {
		await discardDraft(params.draftId);
		redirect(303, resolve('/import'));
	}
};
