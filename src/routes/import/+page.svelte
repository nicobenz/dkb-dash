<script lang="ts">
	import { enhance } from '$app/forms';
	import FileUp from '@lucide/svelte/icons/file-up';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { m } from '#lib/paraglide/messages.js';
	import { date, iban, money, timestamp } from '#lib/format.js';
	import { importErrorMessage } from '#lib/import-errors.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let fileName = $state('');
	let dragging = $state(false);
	let submitting = $state(false);
	let input: HTMLInputElement;

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const files = event.dataTransfer?.files;
		if (!files?.length) return;
		input.files = files;
		fileName = files[0].name;
	}
</script>

<svelte:head><title>{m.import_title()} · {m.app_name()}</title></svelte:head>

<h1 class="text-[1.75rem] leading-tight font-semibold tracking-tight sm:text-[2rem]">
	{m.import_title()}
</h1>
<p class="mt-2 max-w-prose text-ink-soft">{m.import_intro()}</p>

<div class="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
	<form
		method="POST"
		enctype="multipart/form-data"
		class="sheet p-5 sm:p-6"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		{#if form?.error}
			<div
				role="alert"
				class="mb-5 flex items-start gap-2 rounded-[3px] border border-danger-rule bg-danger-tint px-4 py-3 text-sm"
			>
				<CircleAlert class="mt-px size-4 shrink-0 text-danger" aria-hidden="true" />
				<div>
					<p class="font-semibold text-danger">{m.import_error_title()}</p>
					<p class="mt-0.5">
						{#if form.filename}<span class="font-medium">{form.filename}:</span>{/if}
						{importErrorMessage(form.error)}
					</p>
				</div>
			</div>
		{/if}

		<label
			for="csv-file"
			class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[3px] border border-dashed px-6 py-10 text-center transition-colors {dragging
				? 'border-band bg-select/60'
				: 'border-rule-strong hover:border-ink-soft'}"
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => (dragging = false)}
			ondrop={onDrop}
		>
			<FileUp class="size-6 text-band" aria-hidden="true" />
			<span class="font-medium">{m.import_drop()}</span>
			<span class="text-sm text-ink-soft">{m.import_file_label()} · .csv</span>
			{#if fileName}
				<span class="mt-1 rounded-[3px] bg-ground px-2 py-1 font-mono text-sm break-all">
					{m.import_selected({ name: fileName })}
				</span>
			{/if}
		</label>
		<input
			bind:this={input}
			id="csv-file"
			name="file"
			type="file"
			accept=".csv,text/csv"
			required
			class="sr-only"
			onchange={(e) => (fileName = e.currentTarget.files?.[0]?.name ?? '')}
		/>

		<div class="mt-5 flex justify-end">
			<button
				type="submit"
				disabled={submitting}
				class="rounded-[3px] bg-band px-5 py-2.5 font-medium text-band-ink transition-colors hover:bg-band-deep disabled:cursor-progress disabled:opacity-70"
			>
				{submitting ? m.import_reading() : m.import_submit()}
			</button>
		</div>
	</form>

	<aside class="lg:pt-2">
		<h2 class="font-semibold">{m.import_howto_title()}</h2>
		<ol class="mt-3 grid list-decimal gap-2 pl-5 text-[0.95rem] text-ink-soft marker:text-ink-soft">
			<li>{m.import_howto_1()}</li>
			<li>{m.import_howto_2()}</li>
			<li>{m.import_howto_3()}</li>
		</ol>
		<p class="mt-4 text-[0.95rem] text-ink-soft">{m.import_howto_overlap()}</p>
	</aside>
</div>

<section aria-labelledby="history-heading" class="mt-12">
	<h2 id="history-heading" class="text-base font-semibold">{m.import_history_title()}</h2>
	{#if data.imports.length === 0}
		<p class="mt-2 text-ink-soft">{m.import_history_empty()}</p>
	{:else}
		<ul class="mt-3 divide-y divide-rule sheet sm:hidden">
			{#each data.imports as { batch, iban: accountIban } (batch.id)}
				<li class="grid gap-1 px-4 py-3 text-sm">
					<span class="font-medium break-all">{batch.filename}</span>
					<span class="font-mono text-xs text-ink-soft">{iban(accountIban)}</span>
					<span class="text-ink-soft">
						{timestamp(batch.importedAt)}
						{#if batch.firstBookingDate && batch.lastBookingDate}
							· {date(batch.firstBookingDate)} – {date(batch.lastBookingDate)}
						{/if}
					</span>
					<span class="figures grid gap-0.5">
						<span>
							{m.history_added()}
							{batch.addedCount} · {m.history_skipped()}
							{batch.duplicateCount}
						</span>
						<span>
							{money(batch.statementBalanceCents)}
							<span class="text-ink-soft">
								{m.statement_balance_on({ date: date(batch.statementBalanceDate) })}
							</span>
						</span>
					</span>
				</li>
			{/each}
		</ul>
		<div class="mt-3 hidden overflow-x-auto sheet sm:block">
			<table class="w-full border-collapse text-sm">
				<thead>
					<tr class="border-b border-rule-strong text-left text-ink-soft">
						<th scope="col" class="py-2 pl-5 font-medium">{m.history_imported_at()}</th>
						<th scope="col" class="py-2 pl-4 font-medium">{m.history_file()}</th>
						<th scope="col" class="py-2 pl-4 font-medium">{m.history_period()}</th>
						<th scope="col" class="py-2 pl-4 text-right font-medium">{m.history_added()}</th>
						<th scope="col" class="py-2 pl-4 text-right font-medium">{m.history_skipped()}</th>
						<th scope="col" class="py-2 pr-5 pl-4 text-right font-medium">
							{m.history_bank_balance()}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each data.imports as { batch, iban: accountIban } (batch.id)}
						<tr class="border-b border-rule last:border-0">
							<td class="py-2.5 pl-5 whitespace-nowrap">{timestamp(batch.importedAt)}</td>
							<td class="py-2.5 pl-4">
								<span class="block max-w-[16rem] truncate">{batch.filename}</span>
								<span class="block font-mono text-xs text-ink-soft">{iban(accountIban)}</span>
							</td>
							<td class="py-2.5 pl-4 whitespace-nowrap text-ink-soft">
								{#if batch.firstBookingDate && batch.lastBookingDate}
									{date(batch.firstBookingDate)} – {date(batch.lastBookingDate)}
								{:else}—{/if}
							</td>
							<td class="py-2.5 pl-4 text-right">{batch.addedCount}</td>
							<td class="py-2.5 pl-4 text-right text-ink-soft">{batch.duplicateCount}</td>
							<td class="py-2.5 pr-5 pl-4 text-right whitespace-nowrap">
								{money(batch.statementBalanceCents)}
								<span class="block text-xs text-ink-soft">{date(batch.statementBalanceDate)}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
