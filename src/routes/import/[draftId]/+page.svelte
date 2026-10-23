<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Info from '@lucide/svelte/icons/info';
	import { m } from '#lib/paraglide/messages.js';
	import { date, iban, money, shortDate } from '#lib/format.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let busy = $state<'confirm' | 'discard' | null>(null);

	const draft = $derived(data.draft);
	const reason = (r: { reason: string; value: string }) =>
		r.reason === 'bad_date'
			? m.reason_bad_date({ value: r.value })
			: r.reason === 'bad_amount'
				? m.reason_bad_amount({ value: r.value })
				: m.reason_column_count({ value: r.value });
	const counterparty = (row: { type: string; amountCents: number; payer: string; payee: string }) =>
		(row.amountCents > 0 ? row.payer : row.payee) || m.unknown_counterparty();

	const FIRST_ROWS = 50;

	const submit = (kind: 'confirm' | 'discard') => () => {
		busy = kind;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = null;
		};
	};
</script>

{#snippet rowsTable(
	rows: {
		line: number;
		bookingDate: string;
		payer: string;
		payee: string;
		purpose: string;
		type: string;
		amountCents: number;
	}[],
	withHeader: boolean
)}
	<table class="w-full border-collapse text-[0.95rem] {withHeader ? 'mt-3' : ''}">
		<thead class={withHeader ? '' : 'sr-only'}>
			<tr class="border-b border-rule-strong text-left text-sm text-ink-soft">
				<th scope="col" class="w-24 py-2 pl-5 font-medium">{m.col_date()}</th>
				<th scope="col" class="py-2 pl-4 font-medium">{m.col_counterparty()}</th>
				<th scope="col" class="w-px py-2 pr-5 text-right font-medium whitespace-nowrap">
					{m.col_amount()}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.line)}
				<tr class="border-b border-rule align-top last:border-0">
					<td class="py-2.5 pl-5 whitespace-nowrap text-ink-soft">
						{row.bookingDate ? shortDate(row.bookingDate) : '—'}
					</td>
					<td class="max-w-0 py-2.5 pl-4">
						<span class="block truncate font-medium">{counterparty(row)}</span>
						<span class="block truncate text-sm text-ink-soft">{row.purpose || m.no_purpose()}</span
						>
					</td>
					<td
						class="py-2.5 pr-5 pl-4 text-right font-medium whitespace-nowrap {row.amountCents < 0
							? 'text-debit'
							: ''}"
					>
						{money(row.amountCents, 'always')}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/snippet}

<svelte:head><title>{m.review_title()} · {m.app_name()}</title></svelte:head>

{#if !draft}
	<section class="mx-auto max-w-2xl sheet px-6 py-8 sm:px-8">
		<h1 class="text-2xl font-semibold">{m.review_missing_title()}</h1>
		<p class="mt-3 text-ink-soft">{m.review_missing_body()}</p>
		<a class="mt-6 inline-block font-medium text-band underline" href={resolve('/import')}>
			{m.review_missing_action()}
		</a>
	</section>
{:else}
	<h1 class="text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2rem]">
		{m.review_title()}
	</h1>

	<dl class="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
		<div class="flex gap-2">
			<dt class="text-ink-soft">{m.review_file()}</dt>
			<dd class="max-w-[22rem] truncate font-medium">{draft.filename}</dd>
		</div>
		<div class="flex gap-2">
			<dt class="text-ink-soft">{m.review_account()}</dt>
			<dd>{draft.accountKind} · <span class="font-mono">{iban(draft.iban)}</span></dd>
		</div>
		<div class="flex gap-2">
			<dt class="text-ink-soft">{m.review_bank_balance()}</dt>
			<dd class="figures">
				{money(draft.balanceCents)}
				<span class="text-ink-soft"
					>{m.statement_balance_on({ date: date(draft.balanceDate) })}</span
				>
			</dd>
		</div>
	</dl>

	<div class="mt-6 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
		<div class="grid gap-4 lg:sticky lg:top-6">
			<section class="sheet" aria-label={m.review_title()}>
				<dl class="figures divide-y divide-rule">
					<div class="flex items-baseline justify-between gap-4 px-5 py-3.5">
						<dt class="font-medium">{m.review_new()}</dt>
						<dd class="text-2xl font-semibold text-band">{draft.newRows.length}</dd>
					</div>
					<div class="flex items-baseline justify-between gap-4 px-5 py-3.5">
						<dt>
							{#if draft.duplicateRows.length > 0}
								<a href="#already" class="underline decoration-rule-strong hover:decoration-ink">
									{m.review_duplicates()}
								</a>
							{:else}
								{m.review_duplicates()}
							{/if}
						</dt>
						<dd class="text-lg">{draft.duplicateRows.length}</dd>
					</div>
					<div class="px-5 py-3.5">
						<div class="flex items-baseline justify-between gap-4">
							<dt>
								{#if draft.pendingRows.length > 0}
									<a href="#pending" class="underline decoration-rule-strong hover:decoration-ink">
										{m.review_pending()}
									</a>
								{:else}
									{m.review_pending()}
								{/if}
							</dt>
							<dd class="text-lg">{draft.pendingCount}</dd>
						</div>
						{#if draft.pendingCount > 0}
							<p class="mt-1 text-sm text-ink-soft">{m.review_pending_note()}</p>
						{/if}
					</div>
					<div class="px-5 py-3.5">
						<div class="flex items-baseline justify-between gap-4">
							<dt>{m.review_rejected()}</dt>
							<dd class="text-lg {draft.rejected.length > 0 ? 'text-danger' : ''}">
								{draft.rejected.length}
							</dd>
						</div>
						{#if draft.rejected.length > 0}
							<ul class="mt-2 grid gap-1 text-sm">
								{#each draft.rejected.slice(0, 10) as row (row.line)}
									<li>
										<span class="text-ink-soft">{m.review_rejected_line({ line: row.line })}:</span>
										{reason(row)}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</dl>
			</section>

			{#if draft.addsAccount}
				<p
					class="flex items-start gap-2 rounded-[3px] border border-warn-rule bg-warn-tint px-4 py-3 text-sm"
				>
					<CircleAlert class="mt-px size-4 shrink-0 text-warn" aria-hidden="true" />
					<span>{m.review_new_account({ iban: iban(draft.iban) })}</span>
				</p>
			{/if}
			{#if draft.encoding === 'windows-1252'}
				<p class="flex items-start gap-2 px-1 text-sm text-ink-soft">
					<Info class="mt-px size-4 shrink-0" aria-hidden="true" />
					<span>{m.review_encoding()}</span>
				</p>
			{/if}

			<div class="flex flex-wrap items-center gap-3">
				<form method="POST" action="?/confirm" use:enhance={submit('confirm')}>
					<button
						type="submit"
						disabled={busy !== null}
						class="rounded-[3px] bg-band px-5 py-2.5 font-medium text-band-ink transition-colors hover:bg-band-deep disabled:cursor-progress disabled:opacity-70"
					>
						{busy === 'confirm'
							? m.review_importing()
							: draft.newRows.length > 0
								? m.review_confirm({ count: draft.newRows.length })
								: m.review_confirm_balance()}
					</button>
				</form>
				<form method="POST" action="?/discard" use:enhance={submit('discard')}>
					<button
						type="submit"
						disabled={busy !== null}
						class="rounded-[3px] border border-rule-strong bg-sheet px-4 py-2.5 font-medium transition-colors hover:border-ink-soft disabled:opacity-70"
					>
						{m.review_discard()}
					</button>
				</form>
			</div>
		</div>

		<div class="grid min-w-0 gap-4">
			<section aria-labelledby="preview-heading" class="sheet">
				<h2 id="preview-heading" class="px-5 pt-5 text-base font-semibold">
					{m.review_preview_title()}
				</h2>
				{#if draft.newRows.length === 0}
					<p class="px-5 pt-2 pb-6 text-ink-soft">{m.review_nothing_new()}</p>
				{:else}
					{@render rowsTable(draft.newRows.slice(0, FIRST_ROWS), true)}
					{#if draft.newRows.length > FIRST_ROWS}
						<details class="group border-t border-rule">
							<summary
								class="cursor-pointer px-5 py-3 text-sm font-medium text-band group-open:border-b group-open:border-rule hover:underline"
							>
								{m.review_show_rest({ count: draft.newRows.length - FIRST_ROWS })}
							</summary>
							{@render rowsTable(draft.newRows.slice(FIRST_ROWS), false)}
						</details>
					{/if}
				{/if}
			</section>

			{#if draft.duplicateRows.length > 0}
				<details id="already" class="group sheet">
					<summary class="flex cursor-pointer items-baseline justify-between gap-4 px-5 py-4">
						<span class="font-semibold">{m.review_duplicates_title()}</span>
						<span class="text-sm text-band group-open:hidden">{m.review_show_rows()}</span>
					</summary>
					<p class="px-5 pb-2 text-sm text-ink-soft">{m.review_duplicates_note()}</p>
					{@render rowsTable(draft.duplicateRows, true)}
				</details>
			{/if}

			{#if draft.pendingRows.length > 0}
				<details id="pending" class="group sheet">
					<summary class="flex cursor-pointer items-baseline justify-between gap-4 px-5 py-4">
						<span class="font-semibold">{m.review_pending_title()}</span>
						<span class="text-sm text-band group-open:hidden">{m.review_show_rows()}</span>
					</summary>
					<p class="px-5 pb-2 text-sm text-ink-soft">{m.review_pending_note()}</p>
					{@render rowsTable(draft.pendingRows, true)}
				</details>
			{/if}
		</div>
	</div>
{/if}
