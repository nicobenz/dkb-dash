import { getDashboard } from '#lib/server/dashboard.js';
import { getImport } from '#lib/server/imports.js';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, url }) => {
	const { currentAccountId } = await parent();
	if (currentAccountId === null) return { dashboard: undefined, imported: undefined };

	const importedId = Number(url.searchParams.get('imported'));
	const imported =
		Number.isInteger(importedId) && importedId > 0 ? await getImport(importedId) : undefined;

	return {
		dashboard: await getDashboard(currentAccountId, url.searchParams.get('month')),
		imported: imported?.batch
	};
}) satisfies PageServerLoad;
