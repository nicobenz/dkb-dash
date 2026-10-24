<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { money, percent } from '#lib/format.js';
	import { transactionCount } from '#lib/tag-copy.js';
	import type { TagSpending } from '#lib/tags.js';

	let {
		tagCount,
		outCents,
		tags,
		untagged,
		multiTagged
	}: {
		tagCount: number;
		outCents: number;
		tags: TagSpending[];
		untagged: { count: number; outCents: number };
		multiTagged: number;
	} = $props();

	const share = (cents: number) => (outCents === 0 ? 0 : cents / outCents);
</script>

{#snippet shareCell(cents: number)}
	<td class="hidden py-2.5 pl-6 md:table-cell">
		<span class="flex items-center gap-3">
			<span class="h-1.5 flex-1 bg-ground" aria-hidden="true">
				<span class="block h-full bg-ink-soft/45" style:width="{share(cents) * 100}%"></span>
			</span>
			<span class="w-12 text-right text-sm text-ink-soft">{percent(share(cents))}</span>
		</span>
	</td>
{/snippet}

<section aria-labelledby="spending-heading" class="sheet">
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 pt-5 sm:px-6">
		<h2 id="spending-heading" class="text-base font-semibold">{m.spending_title()}</h2>
		{#if tagCount > 0}
			<a
				href={resolve('/tags')}
				class="text-sm font-medium text-band underline decoration-1 underline-offset-[0.2em]"
			>
				{m.spending_manage()}
			</a>
		{/if}
	</div>

	{#if tagCount === 0}
		<p class="max-w-prose px-5 pt-2 pb-5 text-ink-soft sm:px-6">
			{m.spending_no_tags()}
			<a
				href={resolve('/tags/new')}
				class="font-medium text-band underline decoration-1 underline-offset-[0.2em]"
			>
				{m.spending_no_tags_action()}
			</a>
		</p>
	{:else if outCents === 0}
		<p class="px-5 pt-2 pb-5 text-ink-soft sm:px-6">{m.spending_no_out()}</p>
	{:else}
		<table class="mt-3 w-full border-collapse text-[0.95rem]">
			<thead>
				<tr class="border-b border-rule-strong text-left text-sm text-ink-soft">
					<th scope="col" class="py-2 pl-5 font-medium sm:pl-6">{m.col_tag()}</th>
					<th scope="col" class="hidden w-36 py-2 pl-4 text-right font-medium sm:table-cell">
						{m.col_transactions()}
					</th>
					<th scope="col" class="hidden w-[38%] py-2 pl-6 font-medium md:table-cell">
						{m.col_share()}
					</th>
					<th
						scope="col"
						class="w-px py-2 pr-5 pl-4 text-right font-medium whitespace-nowrap sm:w-36 sm:pr-6"
					>
						{m.statement_out()}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each tags as tag (tag.id)}
					<tr class="border-b border-rule last:border-b-0">
						<th scope="row" class="max-w-0 py-2.5 pl-5 text-left font-medium sm:pl-6">
							<span class="block truncate" title={tag.name}>{tag.name}</span>
							<span class="block text-sm font-normal text-ink-soft sm:hidden">
								{transactionCount(tag.count)} · {percent(share(tag.outCents))}
							</span>
						</th>
						<td class="hidden py-2.5 pl-4 text-right whitespace-nowrap text-ink-soft sm:table-cell">
							{transactionCount(tag.count)}
						</td>
						{@render shareCell(tag.outCents)}
						<td
							class="py-2.5 pr-5 pl-4 text-right font-medium whitespace-nowrap text-debit sm:pr-6"
						>
							{money(tag.outCents)}
						</td>
					</tr>
				{/each}
				{#if untagged.count > 0}
					<tr class="text-ink-soft [&>*]:border-t [&>*]:border-rule-strong">
						<th scope="row" class="py-2.5 pl-5 text-left font-medium sm:pl-6">
							{m.spending_untagged()}
							<span class="block text-sm font-normal sm:hidden">
								{transactionCount(untagged.count)} · {percent(share(untagged.outCents))}
							</span>
						</th>
						<td class="hidden py-2.5 pl-4 text-right whitespace-nowrap sm:table-cell">
							{transactionCount(untagged.count)}
						</td>
						{@render shareCell(untagged.outCents)}
						<td
							class="py-2.5 pr-5 pl-4 text-right font-medium whitespace-nowrap text-debit sm:pr-6"
						>
							{money(untagged.outCents)}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
		{#if multiTagged > 0}
			<p class="border-t border-rule px-5 py-3 text-sm text-ink-soft sm:px-6">
				{multiTagged === 1
					? m.spending_overlap_one()
					: m.spending_overlap_other({ count: multiTagged })}
			</p>
		{/if}
	{/if}
</section>
