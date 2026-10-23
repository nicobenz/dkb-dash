<script lang="ts">
	import type { Path } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { iban } from '#lib/format.js';
	import '@fontsource/fira-sans/400.css';
	import '@fontsource/fira-sans/500.css';
	import '@fontsource/fira-sans/600.css';
	import '@fontsource/fira-mono/400.css';
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const current = $derived(data.accounts.find((a) => a.id === data.currentAccountId));
	const onImport = $derived(page.url.pathname.startsWith('/import'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<header class="bg-band text-band-ink">
		<div
			class="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6"
		>
			<a href={resolve('/')} class="text-lg font-semibold tracking-tight">{m.app_name()}</a>
			<nav aria-label={m.nav_label()} class="flex items-center gap-1 text-[0.95rem]">
				<a
					href={resolve('/')}
					aria-current={onImport ? undefined : 'page'}
					class="rounded-[3px] px-3 py-1.5 text-band-soft transition-colors hover:text-band-ink aria-[current=page]:bg-band-deep aria-[current=page]:text-band-ink"
				>
					{m.nav_overview()}
				</a>
				<a
					href={resolve('/import')}
					aria-current={onImport ? 'page' : undefined}
					class="rounded-[3px] px-3 py-1.5 text-band-soft transition-colors hover:text-band-ink aria-[current=page]:bg-band-deep aria-[current=page]:text-band-ink"
				>
					{m.nav_import()}
				</a>
			</nav>

			{#if current}
				<div class="ml-auto flex items-center gap-3 text-sm">
					{#if data.accounts.length > 1}
						<form method="GET" action={resolve('/')} class="contents">
							<label class="sr-only" for="account-switch">{m.account_switch()}</label>
							<select
								id="account-switch"
								name="account"
								class="rounded-[3px] border-band-soft/40 bg-band-deep py-1 pr-8 pl-2 font-mono text-sm text-band-ink"
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							>
								{#each data.accounts as account (account.id)}
									<option value={account.id} selected={account.id === current.id}>
										{account.kind} · {iban(account.iban)}
									</option>
								{/each}
							</select>
							<noscript><button class="underline">{m.account_switch()}</button></noscript>
						</form>
					{:else}
						<span class="text-band-soft">{current.kind}</span>
						<span class="font-mono tracking-tight">{iban(current.iban)}</span>
					{/if}
				</div>
			{/if}
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
		{@render children()}
	</main>

	<footer class="border-t border-rule">
		<div
			class="mx-auto flex w-full max-w-6xl flex-wrap gap-x-6 gap-y-1 px-4 py-5 text-sm text-ink-soft sm:px-6"
		>
			<p>{m.footer_privacy()}</p>
			<p>{m.footer_affiliation()}</p>
		</div>
	</footer>
</div>

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Path)}>{locale}</a>
	{/each}
</div>
