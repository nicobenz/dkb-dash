<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { SvelteSet } from 'svelte/reactivity';
	import { m } from '#lib/paraglide/messages.js';
	import { date, iban, money, shortDate } from '#lib/format.js';
	import { resolve } from '$app/paths';
	import { fieldLabel } from '#lib/tag-copy.js';
	import type { Rule } from '#lib/tags.js';
	import TagChip from './TagChip.svelte';

	type Row = {
		id: number;
		bookingDate: string;
		payer: string;
		payee: string;
		purpose: string;
		type: string;
		counterpartyIban: string;
		amountCents: number;
		balanceCents: number;
		customerReference: string;
		mandateReference: string;
		tags: { id: number; name: string; rule: Rule }[];
	};

	let {
		rows,
		openingDate,
		closingDate,
		openingCents,
		closingCents
	}: {
		rows: Row[];
		openingDate: string;
		closingDate: string;
		openingCents: number;
		closingCents: number;
	} = $props();

	type SortKey = 'date' | 'amount';
	let sort = $state<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'asc' });
	const open = new SvelteSet<number>();

	/** The statement's own order is by date; only then do the bracket rows and running balance make sense. */
	const statementOrder = $derived(sort.key === 'date' && sort.dir === 'asc');

	const sorted = $derived.by(() => {
		const list = [...rows];
		if (sort.key === 'amount') list.sort((a, b) => a.amountCents - b.amountCents || a.id - b.id);
		if (sort.dir === 'desc') list.reverse();
		return list;
	});

	function toggleSort(key: SortKey) {
		sort =
			sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' };
	}

	function toggle(id: number) {
		if (open.has(id)) open.delete(id);
		else open.add(id);
	}

	const incoming = (row: Row) => row.type === 'Eingang' || row.amountCents > 0;
	const counterparty = (row: Row) =>
		(incoming(row) ? row.payer : row.payee) || m.unknown_counterparty();
	const ariaSort = (key: SortKey) =>
		sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
</script>

{#snippet sortButton(key: SortKey, label: string)}
	<button
		type="button"
		class="inline-flex items-center gap-1 font-medium hover:text-ink"
		onclick={() => toggleSort(key)}
		aria-label={m.transactions_sort_by({ column: label })}
	>
		{label}
		{#if sort.key === key}
			{#if sort.dir === 'asc'}
				<ArrowUp class="size-3.5" aria-hidden="true" />
			{:else}
				<ArrowDown class="size-3.5" aria-hidden="true" />
			{/if}
		{/if}
	</button>
{/snippet}

<section aria-labelledby="transactions-heading" class="sheet">
	<h2 id="transactions-heading" class="px-5 pt-5 text-base font-semibold sm:px-6">
		{m.transactions_title()}
	</h2>

	<table class="mt-3 w-full border-collapse text-[0.95rem]">
		<thead>
			<tr class="border-b border-rule-strong text-left text-sm text-ink-soft">
				<th
					scope="col"
					class="hidden w-24 py-2 pl-6 font-medium sm:table-cell"
					aria-sort={ariaSort('date')}
				>
					{@render sortButton('date', m.col_date())}
				</th>
				<th scope="col" class="py-2 pl-11 font-medium sm:pl-10">
					<span class="sm:hidden">{@render sortButton('date', m.col_date())} ·</span>
					{m.col_counterparty()}
				</th>
				<th
					scope="col"
					class="w-px py-2 pr-5 text-right whitespace-nowrap sm:w-32 sm:pr-4"
					aria-sort={ariaSort('amount')}
				>
					{@render sortButton('amount', m.col_amount())}
				</th>
				<th scope="col" class="hidden w-36 py-2 pr-6 text-right font-medium md:table-cell">
					{m.col_balance()}
				</th>
			</tr>
		</thead>

		<tbody>
			{#if statementOrder}
				<tr class="border-b border-rule text-ink-soft">
					<td class="hidden py-2.5 pl-6 sm:table-cell">{shortDate(openingDate)}</td>
					<td class="py-2.5 pl-11 italic sm:pl-10">{m.row_opening()}</td>
					<td class="py-2.5 pr-5 text-right whitespace-nowrap sm:pr-4 md:hidden">
						{money(openingCents)}
					</td>
					<td class="hidden md:table-cell"></td>
					<td class="hidden py-2.5 pr-6 text-right md:table-cell">{money(openingCents)}</td>
				</tr>
			{/if}

			{#each sorted as row (row.id)}
				{@const expanded = open.has(row.id)}
				<tr class="border-b border-rule align-top transition-colors hover:bg-ground/60">
					<td class="hidden py-2.5 pl-6 whitespace-nowrap text-ink-soft sm:table-cell">
						{shortDate(row.bookingDate)}
					</td>
					<td class="max-w-0 py-2.5 pl-5 sm:pl-4">
						<button
							type="button"
							class="group flex w-full min-w-0 items-start gap-2 text-left"
							aria-expanded={expanded}
							aria-controls="tx-{row.id}"
							onclick={() => toggle(row.id)}
						>
							<ChevronDown
								class="mt-1 size-4 shrink-0 text-ink-soft transition-transform group-hover:text-ink {expanded
									? 'rotate-180'
									: ''}"
								aria-hidden="true"
							/>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-medium">{counterparty(row)}</span>
								<span class="block truncate text-sm text-ink-soft">
									<span class="sm:hidden">{shortDate(row.bookingDate)} ·&nbsp;</span>{row.purpose ||
										m.no_purpose()}
								</span>
								{#if row.tags.length > 0}
									<span class="mt-1 flex flex-wrap gap-1">
										<span class="sr-only">{m.row_tags()}:</span>
										{#each row.tags as tag (tag.id)}
											<TagChip name={tag.name} />
										{/each}
									</span>
								{/if}
							</span>
							<span class="sr-only">{expanded ? m.row_hide_details() : m.row_details()}</span>
						</button>
					</td>
					<td
						class="py-2.5 pr-5 text-right font-medium whitespace-nowrap sm:pr-4 {row.amountCents < 0
							? 'text-debit'
							: ''}"
					>
						{money(row.amountCents, 'always')}
						{#if statementOrder}
							<span class="block text-sm font-normal text-ink-soft md:hidden">
								{money(row.balanceCents)}
							</span>
						{/if}
					</td>
					<td class="hidden py-2.5 pr-6 text-right whitespace-nowrap text-ink-soft md:table-cell">
						{statementOrder ? money(row.balanceCents) : ''}
					</td>
				</tr>
				{#if expanded}
					<tr id="tx-{row.id}" class="border-b border-rule bg-ground/50">
						<td colspan="4" class="px-5 py-4 sm:px-6">
							<dl class="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
								<dt class="text-ink-soft">{m.detail_purpose()}</dt>
								<dd class="break-words">{row.purpose || m.no_purpose()}</dd>
								<dt class="text-ink-soft">{m.detail_payer()}</dt>
								<dd class="break-words">{row.payer || '—'}</dd>
								<dt class="text-ink-soft">{m.detail_payee()}</dt>
								<dd class="break-words">{row.payee || '—'}</dd>
								<dt class="text-ink-soft">{m.detail_type()}</dt>
								<dd>
									{incoming(row) ? m.type_incoming() : m.type_outgoing()} · {date(row.bookingDate)}
								</dd>
								{#if row.tags.length > 0}
									<dt class="text-ink-soft">{m.detail_tags()}</dt>
									<dd>
										<ul class="grid gap-1.5">
											{#each row.tags as tag (tag.id)}
												<li class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
													<TagChip
														name={tag.name}
														href={resolve('/tags/[id]', { id: String(tag.id) })}
													/>
													<span class="text-ink-soft">
														{m.detail_tag_reason({
															field: fieldLabel(tag.rule.field),
															text: tag.rule.text
														})}
													</span>
												</li>
											{/each}
										</ul>
									</dd>
								{/if}
								{#if row.counterpartyIban}
									<dt class="text-ink-soft">{m.detail_iban()}</dt>
									<dd class="font-mono break-all">{iban(row.counterpartyIban)}</dd>
								{/if}
								{#if row.customerReference}
									<dt class="text-ink-soft">{m.detail_customer_reference()}</dt>
									<dd class="font-mono break-all">{row.customerReference}</dd>
								{/if}
								{#if row.mandateReference}
									<dt class="text-ink-soft">{m.detail_mandate_reference()}</dt>
									<dd class="font-mono break-all">{row.mandateReference}</dd>
								{/if}
							</dl>
						</td>
					</tr>
				{/if}
			{:else}
				<tr class="border-b border-rule">
					<td colspan="4" class="px-5 py-8 text-center text-ink-soft sm:px-6">
						{m.transactions_empty()}
					</td>
				</tr>
			{/each}

			{#if statementOrder}
				<tr class="border-t-2 border-ink font-semibold">
					<td class="hidden py-3 pl-6 sm:table-cell">{shortDate(closingDate)}</td>
					<td class="py-3 pl-11 sm:pl-10">{m.row_closing()}</td>
					<td class="py-3 pr-5 text-right whitespace-nowrap sm:pr-4 md:hidden">
						{money(closingCents)}
					</td>
					<td class="hidden md:table-cell"></td>
					<td class="hidden py-3 pr-6 text-right whitespace-nowrap md:table-cell">
						{money(closingCents)}
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</section>
