<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { m } from '#lib/paraglide/messages.js';
	import TagEditor from '#lib/components/TagEditor.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const tag = $derived(data.tag);
	let confirming = $state<HTMLDetailsElement>();
	let deleteToggle = $state<HTMLElement>();

	function keep() {
		if (confirming) confirming.open = false;
		deleteToggle?.focus();
	}
</script>

<svelte:head>
	<title>{tag ? tag.name : m.tag_missing_title()} · {m.app_name()}</title>
</svelte:head>

<a
	href={resolve('/tags')}
	class="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
>
	<ChevronLeft class="size-4" aria-hidden="true" />
	{m.tag_back()}
</a>

{#if !tag}
	<section class="mt-4 max-w-2xl sheet px-6 py-8 sm:px-8">
		<h1 class="text-2xl font-semibold">{m.tag_missing_title()}</h1>
		<p class="mt-3 text-ink-soft">{m.tag_missing_body()}</p>
	</section>
{:else}
	<h1
		class="mt-2 text-[1.75rem] leading-tight font-semibold tracking-tight break-words sm:text-[2rem]"
	>
		{tag.name}
	</h1>

	{#if data.saved && !form}
		<p role="status" class="mt-3 flex items-start gap-2 text-sm">
			<CircleCheck class="mt-px size-4 shrink-0 text-band" aria-hidden="true" />
			<span>{m.tag_saved()}</span>
		</p>
	{/if}

	<div class="mt-6 grid gap-6">
		{#key tag.id}
			<TagEditor
				accountId={data.currentAccountId}
				tagId={tag.id}
				initial={form?.values ?? tag}
				saved={tag.rules}
				preview={form ? null : (data.preview ?? null)}
				error={form?.error}
				action="?/save"
				submitLabel={m.tag_save()}
			/>
		{/key}

		<details bind:this={confirming} class="group">
			<summary
				bind:this={deleteToggle}
				class="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-[3px] py-1.5 text-sm font-medium text-danger transition-colors hover:underline [&::-webkit-details-marker]:hidden"
			>
				<Trash2 class="size-4" aria-hidden="true" />
				{m.tag_delete()}
			</summary>
			<form
				method="POST"
				action="?/delete"
				use:enhance
				class="mt-3 max-w-2xl rounded-[3px] border border-danger-rule bg-danger-tint px-4 py-4 text-sm sm:px-5"
			>
				<p>
					{(data.preview?.count ?? 0) === 1
						? m.tag_delete_confirm_one({ name: tag.name })
						: m.tag_delete_confirm_other({ name: tag.name, count: data.preview?.count ?? 0 })}
				</p>
				<div class="mt-4 flex flex-wrap gap-3">
					<button
						type="submit"
						class="rounded-[3px] border border-danger bg-sheet px-4 py-2 font-medium text-danger transition-colors hover:bg-danger hover:text-sheet"
					>
						{m.tag_delete_yes({ name: tag.name })}
					</button>
					<button
						type="button"
						onclick={keep}
						class="rounded-[3px] border border-rule-strong bg-sheet px-4 py-2 font-medium transition-colors hover:border-ink-soft"
					>
						{m.tag_delete_keep()}
					</button>
				</div>
			</form>
		</details>
	</div>
{/if}
