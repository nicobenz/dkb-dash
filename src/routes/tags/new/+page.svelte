<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { m } from '#lib/paraglide/messages.js';
	import TagEditor from '#lib/components/TagEditor.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>{m.tag_new_title()} · {m.app_name()}</title></svelte:head>

<a
	href={resolve('/tags')}
	class="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
>
	<ChevronLeft class="size-4" aria-hidden="true" />
	{m.tag_back()}
</a>
<h1 class="mt-2 text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2rem]">
	{m.tag_new_title()}
</h1>

<div class="mt-6 grid gap-6">
	<TagEditor
		accountId={data.currentAccountId}
		tagId={undefined}
		initial={form?.values ?? { name: '', rules: [] }}
		saved={[]}
		preview={form ? null : data.preview}
		error={form?.error}
		action=""
		submitLabel={m.tag_create()}
	/>
</div>
