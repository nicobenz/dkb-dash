<script lang="ts">
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { m } from '#lib/paraglide/messages.js';
	import { date, money, monthName } from '#lib/format.js';
	import { prefersReducedMotion } from 'svelte/motion';

	type Check = {
		anchor: { date: string; cents: number };
		derivedCents: number;
		differenceCents: number;
	};

	let {
		month,
		openingDate,
		closingDate,
		openingCents,
		inCents,
		outCents,
		closingCents,
		inCount,
		outCount,
		evidence,
		anchorDate
	}: {
		month: string;
		openingDate: string;
		closingDate: string;
		openingCents: number;
		inCents: number;
		outCents: number;
		closingCents: number;
		inCount: number;
		outCount: number;
		evidence: Check | undefined;
		anchorDate: string;
	} = $props();

	const count = (n: number) =>
		n === 1 ? m.statement_count_one() : m.statement_count_other({ count: n });

	const settle = (node: Element) =>
		fly(node, { y: 4, duration: prefersReducedMotion.current ? 0 : 280, easing: expoOut });
</script>

<section aria-labelledby="statement-heading" class="overflow-hidden sheet">
	<h2 id="statement-heading" class="sr-only">{m.statement_label({ month: monthName(month) })}</h2>
	<div
		class="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-4 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.3fr] lg:gap-x-5 lg:py-7"
	>
		{#key month}
			<div class="col-span-2 lg:col-span-1" in:settle>
				<p class="text-sm text-ink-soft">
					{m.statement_opening()}
					<span class="whitespace-nowrap lg:block"
						>{m.statement_balance_on({ date: date(openingDate) })}</span
					>
				</p>
				<p
					class="figures mt-1 text-[1.75rem] leading-tight font-medium sm:text-[2rem] lg:text-[2.5rem]"
				>
					{money(openingCents)}
				</p>
			</div>

			<span
				aria-hidden="true"
				class="figures text-2xl text-ink-soft lg:self-end lg:pb-2 lg:text-3xl">+</span
			>
			<div in:settle>
				<p class="text-sm text-ink-soft">
					{m.statement_in()}
					<span class="whitespace-nowrap lg:block"
						><span class="lg:hidden">·&nbsp;</span>{count(inCount)}</span
					>
				</p>
				<p
					class="figures mt-1 text-[1.75rem] leading-tight font-medium sm:text-[2rem] lg:text-[2.5rem]"
				>
					{money(inCents, 'never')}
				</p>
			</div>

			<span aria-hidden="true" class="figures text-2xl text-debit lg:self-end lg:pb-2 lg:text-3xl"
				>−</span
			>
			<div in:settle>
				<p class="text-sm text-ink-soft">
					{m.statement_out()}
					<span class="whitespace-nowrap lg:block"
						><span class="lg:hidden">·&nbsp;</span>{count(outCount)}</span
					>
				</p>
				<p
					class="figures mt-1 text-[1.75rem] leading-tight font-medium text-debit sm:text-[2rem] lg:text-[2.5rem]"
				>
					{money(outCents, 'never')}
				</p>
			</div>

			<span
				aria-hidden="true"
				class="figures text-2xl text-ink-soft lg:self-end lg:pb-2 lg:text-3xl">=</span
			>
			<div class="border-t-2 border-ink pt-3 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-5" in:settle>
				<p class="text-sm text-ink-soft">
					{m.statement_closing()}
					<span class="whitespace-nowrap lg:block"
						>{m.statement_balance_on({ date: date(closingDate) })}</span
					>
				</p>
				<p
					class="figures mt-1 text-[2rem] leading-tight font-semibold sm:text-[2.25rem] lg:text-[3rem]"
				>
					{money(closingCents)}
				</p>
			</div>
		{/key}
	</div>

	{#if evidence && evidence.differenceCents === 0}
		<p class="flex items-start gap-2 border-t border-rule bg-select/50 px-5 py-3 text-sm sm:px-8">
			<CircleCheck class="mt-px size-4 shrink-0 text-band" aria-hidden="true" />
			<span>
				<strong class="font-semibold text-band">{m.statement_reconciled()}.</strong>
				{m.statement_reconciled_detail({
					amount: money(evidence.anchor.cents),
					date: date(evidence.anchor.date)
				})}
			</span>
		</p>
	{:else if evidence}
		<p
			class="flex items-start gap-2 border-t border-warn-rule bg-warn-tint px-5 py-3 text-sm sm:px-8"
		>
			<TriangleAlert class="mt-px size-4 shrink-0 text-warn" aria-hidden="true" />
			<span>
				<strong class="font-semibold text-warn">{m.statement_mismatch()}.</strong>
				{m.statement_mismatch_detail({
					bank: money(evidence.anchor.cents),
					date: date(evidence.anchor.date),
					derived: money(evidence.derivedCents),
					difference: money(Math.abs(evidence.differenceCents))
				})}
			</span>
		</p>
	{:else}
		<p class="border-t border-rule px-5 py-3 text-sm text-ink-soft sm:px-8">
			{m.statement_derived_detail({ date: date(anchorDate) })}
		</p>
	{/if}
</section>
