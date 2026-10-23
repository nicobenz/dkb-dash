<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import FileUp from '@lucide/svelte/icons/file-up';
	import { m } from '#lib/paraglide/messages.js';
	import { date, monthName } from '#lib/format.js';
	import { previousDay, shiftMonth } from '#lib/ledger.js';
	import StatementBracket from '#lib/components/StatementBracket.svelte';
	import BalanceChart from '#lib/components/BalanceChart.svelte';
	import TransactionTable from '#lib/components/TransactionTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const d = $derived(data.dashboard);

	/** Query string for another month, keeping the selected account. */
	function monthQuery(month: string) {
		const account = page.url.searchParams.get('account');
		return account ? `account=${encodeURIComponent(account)}&month=${month}` : `month=${month}`;
	}

	const prev = $derived(d && d.month > d.months[0] ? shiftMonth(d.month, -1) : undefined);
	const next = $derived(d && d.month < d.months.at(-1)! ? shiftMonth(d.month, 1) : undefined);
	const closingDate = $derived(d ? (d.last < d.anchor.date ? d.last : d.anchor.date) : '');
</script>

<svelte:head>
	<title>{d ? `${monthName(d.month)} · ${m.app_name()}` : m.app_name()}</title>
</svelte:head>

{#if !d}
	<section class="mx-auto max-w-2xl sheet px-6 py-10 sm:px-10">
		<h1 class="text-2xl font-semibold text-balance sm:text-[1.75rem]">{m.empty_title()}</h1>
		<p class="mt-3 max-w-prose text-ink-soft">{m.empty_body()}</p>
		<a
			href={resolve('/import')}
			class="mt-7 inline-flex items-center gap-2 rounded-[3px] bg-band px-4 py-2.5 font-medium text-band-ink transition-colors hover:bg-band-deep"
		>
			<FileUp class="size-4" aria-hidden="true" />
			{m.empty_action()}
		</a>
	</section>
{:else}
	{#if data.imported}
		{@const batch = data.imported}
		<p role="status" class="mb-6 flex items-start gap-2 text-sm">
			<CircleCheck class="mt-px size-4 shrink-0 text-band" aria-hidden="true" />
			<span>
				{#if batch.addedCount > 0}
					{m.imported_banner({ added: batch.addedCount, file: batch.filename })}
					{#if batch.duplicateCount > 0}{m.imported_banner_skipped({
							skipped: batch.duplicateCount
						})}{/if}
				{:else}
					{m.imported_banner_nothing({ file: batch.filename })}
				{/if}
			</span>
		</p>
	{/if}

	<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
		<div>
			<h1 class="text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2rem]">
				{monthName(d.month)}
			</h1>
			<p class="mt-1 text-sm text-ink-soft">
				{m.month_range({ from: date(d.first), to: date(closingDate) })}
			</p>
		</div>
		<nav
			class="flex items-center gap-1"
			aria-label={m.statement_label({ month: monthName(d.month) })}
		>
			{#if prev}
				<a
					href="{resolve('/')}?{monthQuery(prev)}"
					class="inline-flex items-center gap-1 rounded-[3px] border border-rule-strong bg-sheet py-1.5 pr-3 pl-2 text-sm font-medium transition-colors hover:border-ink-soft"
				>
					<ChevronLeft class="size-4" aria-hidden="true" />
					<span class="sr-only">{m.month_previous()}:</span>
					{monthName(prev, 'short')}
				</a>
			{/if}
			{#if next}
				<a
					href="{resolve('/')}?{monthQuery(next)}"
					class="inline-flex items-center gap-1 rounded-[3px] border border-rule-strong bg-sheet py-1.5 pr-2 pl-3 text-sm font-medium transition-colors hover:border-ink-soft"
				>
					<span class="sr-only">{m.month_next()}:</span>
					{monthName(next, 'short')}
					<ChevronRight class="size-4" aria-hidden="true" />
				</a>
			{/if}
		</nav>
	</div>

	<div class="mt-6 grid gap-6">
		<StatementBracket
			month={d.month}
			openingDate={previousDay(d.first)}
			{closingDate}
			openingCents={d.openingCents}
			inCents={d.inCents}
			outCents={d.outCents}
			closingCents={d.closingCents}
			inCount={d.transactions.filter((t) => t.amountCents > 0).length}
			outCount={d.transactions.filter((t) => t.amountCents < 0).length}
			evidence={d.evidence}
			anchorDate={d.anchor.date}
		/>

		<BalanceChart balances={d.balances} highlightFrom={d.first} highlightTo={closingDate} />

		<TransactionTable
			rows={d.transactions}
			openingDate={d.first}
			{closingDate}
			openingCents={d.openingCents}
			closingCents={d.closingCents}
		/>
	</div>
{/if}
