import { listAccounts } from '#lib/server/dashboard.js';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ url }) => {
	const accounts = await listAccounts();
	const requested = Number(url.searchParams.get('account'));
	const current = accounts.find((a) => a.id === requested) ?? accounts[0];
	return {
		accounts: accounts.map(({ id, iban, kind }) => ({ id, iban, kind })),
		currentAccountId: current?.id ?? null
	};
}) satisfies LayoutServerLoad;
