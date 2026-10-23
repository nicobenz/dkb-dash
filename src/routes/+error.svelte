<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';

	const title = $derived(
		page.error?.code === 'database'
			? m.error_database_title()
			: page.status === 404
				? m.error_not_found_title()
				: m.error_title()
	);
</script>

<svelte:head><title>{title} · {m.app_name()}</title></svelte:head>

<section class="mx-auto max-w-2xl sheet px-6 py-8 sm:px-8">
	<p class="figures text-sm text-ink-soft">{page.status}</p>
	<h1 class="mt-1 text-2xl font-semibold text-balance">{title}</h1>
	{#if page.error?.code === 'database'}
		<p class="mt-3 max-w-prose text-ink-soft">{m.error_database_body()}</p>
	{/if}
	<a class="mt-6 inline-block font-medium text-band underline" href={resolve('/')}>
		{m.error_back_home()}
	</a>
</section>
