<script lang="ts">
	import { resolve } from '$app/paths';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Plus from '@lucide/svelte/icons/plus';
	import { m } from '#lib/paraglide/messages.js';
	import { money, monthName } from '#lib/format.js';
	import { ruleCount } from '#lib/tag-copy.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const overview = $derived(data.overview);
</script>

<svelte:head><title>{m.tags_title()} · {m.app_name()}</title></svelte:head>

{#if data.deleted}
	<p role="status" class="mb-6 flex items-start gap-2 text-sm">
		<CircleCheck class="mt-px size-4 shrink-0 text-band" aria-hidden="true" />
		<span>{m.tags_deleted({ name: data.deleted })}</span>
	</p>
{/if}

<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
	<div>
		<h1 class="text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2rem]">
			{m.tags_title()}
		</h1>
		<p class="mt-2 max-w-prose text-ink-soft">{m.tags_intro()}</p>
	</div>
	<a
		href={resolve('/tags/new')}
		class="inline-flex items-center gap-2 rounded-[3px] bg-band px-4 py-2.5 font-medium text-band-ink transition-colors hover:bg-band-deep"
	>
		<Plus class="size-4" aria-hidden="true" />
		{m.tags_new()}
	</a>
</div>

{#if overview.tags.length === 0}
	<section class="mt-8 max-w-2xl sheet px-6 py-10 sm:px-10">
		<h2 class="text-2xl font-semibold text-balance">{m.tags_empty_title()}</h2>
		<p class="mt-3 max-w-prose text-ink-soft">{m.tags_empty_body()}</p>
	</section>
{:else}
	<section class="mt-8 sheet" aria-label={m.tags_title()}>
		<table class="w-full border-collapse text-[0.95rem]">
			<thead>
				<tr class="border-b border-rule-strong text-left text-sm text-ink-soft">
					<th scope="col" class="py-2 pl-5 font-medium sm:pl-6">{m.col_tag()}</th>
					<th scope="col" class="hidden py-2 pl-4 font-medium sm:table-cell">{m.col_rules()}</th>
					<th scope="col" class="py-2 pr-5 pl-4 text-right font-medium sm:pr-6 md:pr-4">
						{m.col_transactions()}
					</th>
					{#if overview.month}
						<th
							scope="col"
							class="hidden py-2 pr-6 pl-4 text-right font-medium whitespace-nowrap md:table-cell"
						>
							{m.col_month_out({ month: monthName(overview.month, 'short') })}
						</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each overview.tags as tag (tag.id)}
					<tr class="border-b border-rule transition-colors last:border-0 hover:bg-ground/60">
						<td class="max-w-0 py-2.5 pl-5 sm:pl-6">
							<a
								href={resolve('/tags/[id]', { id: String(tag.id) })}
								class="block truncate font-medium underline decoration-rule-strong underline-offset-[0.2em] hover:decoration-ink"
							>
								{tag.name}
							</a>
							<span class="block text-sm text-ink-soft sm:hidden">
								{tag.ruleCount === 0 ? m.tags_no_rules() : ruleCount(tag.ruleCount)}
							</span>
						</td>
						<td class="hidden py-2.5 pl-4 whitespace-nowrap text-ink-soft sm:table-cell">
							{tag.ruleCount === 0 ? m.tags_no_rules() : ruleCount(tag.ruleCount)}
						</td>
						<td class="py-2.5 pr-5 pl-4 text-right whitespace-nowrap sm:pr-6 md:pr-4"
							>{tag.count}</td
						>
						{#if overview.month}
							<td
								class="hidden py-2.5 pr-6 pl-4 text-right font-medium whitespace-nowrap md:table-cell {tag.monthOutCents <
								0
									? 'text-debit'
									: 'text-ink-soft'}"
							>
								{money(tag.monthOutCents)}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}
