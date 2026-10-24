import { tagsOverview } from '#lib/server/tags.js';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent, url }) => {
	const { currentAccountId } = await parent();
	return {
		overview: await tagsOverview(currentAccountId),
		deleted: url.searchParams.get('deleted')
	};
}) satisfies PageServerLoad;
