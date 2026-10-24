<script lang="ts">
	import { AreaChart, Tooltip } from 'layerchart';
	import { scaleTime } from 'd3-scale';
	import { curveStepAfter } from 'd3-shape';
	import { m } from '#lib/paraglide/messages.js';
	import { date, intlLocale, money, monthName } from '#lib/format.js';

	let {
		balances,
		highlightFrom,
		highlightTo
	}: {
		balances: { date: string; cents: number }[];
		highlightFrom: string;
		highlightTo: string;
	} = $props();

	const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

	const points = $derived(
		balances.map((b) => ({
			date: toDate(b.date),
			euros: b.cents / 100,
			cents: b.cents,
			iso: b.date
		}))
	);

	const low = $derived(points.reduce((a, b) => (b.cents < a.cents ? b : a), points[0]));
	const high = $derived(points.reduce((a, b) => (b.cents > a.cents ? b : a), points[0]));

	/** Closing balance per month, for the table that stands in for the chart. */
	const monthly = $derived(
		Object.entries(Object.fromEntries(points.map((p) => [p.iso.slice(0, 7), p.cents])))
	);

	const axisMonth = new Intl.DateTimeFormat(intlLocale(), { month: 'short', timeZone: 'UTC' });
	const axisDay = new Intl.DateTimeFormat(intlLocale(), {
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	});
	/** Under three months of history, month names alone repeat on every tick. */
	const axisDate = $derived(points.length < 92 ? axisDay : axisMonth);
	const axisEuros = new Intl.NumberFormat(intlLocale(), {
		style: 'currency',
		currency: 'EUR',
		notation: 'compact',
		maximumFractionDigits: 1
	});
</script>

<figure class="sheet px-4 pt-5 pb-3 sm:px-6">
	<figcaption class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-1">
		<h2 class="text-base font-semibold">{m.chart_title()}</h2>
		{#if points.length > 0}
			<span class="text-sm text-ink-soft">
				{m.chart_caption({ from: date(points[0].iso), to: date(points.at(-1)!.iso) })}
			</span>
		{/if}
	</figcaption>

	{#if points.length > 1}
		<div class="mt-3 h-56 sm:h-64" aria-hidden="true">
			<AreaChart
				data={points}
				x="date"
				y="euros"
				xScale={scaleTime()}
				padding={{ left: 56, bottom: 24, top: 8, right: 8 }}
				grid={{ y: true, x: false }}
				rule={false}
				props={{
					area: {
						curve: curveStepAfter,
						fillOpacity: 0.08,
						line: { class: 'stroke-band stroke-[1.75]' }
					},
					xAxis: {
						format: (d: Date) => axisDate.format(d),
						ticks: 6,
						tickLength: 0,
						tickLabelProps: { class: 'fill-ink-soft text-xs' }
					},
					yAxis: {
						format: (v: number) => axisEuros.format(v),
						ticks: 4,
						tickLength: 0,
						tickLabelProps: { class: 'fill-ink-soft text-xs figures' }
					},
					grid: { class: 'stroke-rule' },
					highlight: {
						points: { class: 'fill-band stroke-sheet' },
						lines: { class: 'stroke-rule-strong' }
					}
				}}
			>
				{#snippet belowMarks({ context })}
					<!-- Only mark the month when there is history before it; points[0] is just its opening day. -->
					{#if (points[1]?.iso ?? highlightFrom) < highlightFrom}
						{@const x0 = context.xScale(toDate(highlightFrom))}
						{@const x1 = context.xScale(toDate(highlightTo))}
						<rect
							x={Math.max(0, x0)}
							y={0}
							width={Math.max(0, Math.min(context.width, x1) - Math.max(0, x0))}
							height={context.height}
							class="fill-select/60"
						/>
					{/if}
				{/snippet}
				{#snippet tooltip({ context })}
					<Tooltip.Root
						{context}
						classes={{ root: 'rounded-[3px] border border-rule bg-sheet px-3 py-2 shadow-sm' }}
					>
						{#snippet children({ data })}
							<div class="text-xs text-ink-soft">{date(data.iso)}</div>
							<div class="figures text-sm font-medium">{money(data.cents)}</div>
						{/snippet}
					</Tooltip.Root>
				{/snippet}
			</AreaChart>
		</div>

		<p class="sr-only">
			{m.chart_summary({
				low: money(low.cents),
				lowDate: date(low.iso),
				high: money(high.cents),
				highDate: date(high.iso)
			})}
		</p>
		<table class="sr-only">
			<thead>
				<tr><th>{m.chart_table_month()}</th><th>{m.chart_table_closing()}</th></tr>
			</thead>
			<tbody>
				{#each monthly as [month, cents] (month)}
					<tr><td>{monthName(month)}</td><td>{money(cents)}</td></tr>
				{/each}
			</tbody>
		</table>
	{/if}
</figure>
