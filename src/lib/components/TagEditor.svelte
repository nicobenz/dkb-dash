<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { m } from '#lib/paraglide/messages.js';
	import { listDate, money } from '#lib/format.js';
	import { RULE_FIELDS, incoming, type Rule, type RuleField } from '#lib/tags.js';
	import { fieldLabel, ruleMatchCount, tagErrorMessage } from '#lib/tag-copy.js';
	import type { RulePreview, TagInputError } from '#lib/server/tags.js';
	import TagChip from './TagChip.svelte';

	let {
		accountId,
		tagId,
		initial,
		saved,
		preview: serverPreview,
		error,
		action,
		submitLabel
	}: {
		accountId: number | null;
		tagId: number | undefined;
		/** What the form opens with: the saved tag, or the values of a refused save. */
		initial: { name: string; rules: Rule[] };
		/** The stored rules, to tell whether the preview shows unsaved changes. */
		saved: Rule[];
		preview: RulePreview | null;
		error: TagInputError | undefined;
		action: string;
		submitLabel: string;
	} = $props();

	type DraftRule = { key: number; field: RuleField; text: string };
	let nextKey = 0;
	const draft = (r: Rule): DraftRule => ({ key: nextKey++, field: r.field, text: r.text });

	// The form owns its values from here on; later prop changes come with a fresh mount.
	// svelte-ignore state_referenced_locally
	let name = $state(initial.name);
	// svelte-ignore state_referenced_locally
	let rules = $state<DraftRule[]>(
		initial.rules.length > 0
			? initial.rules.map(draft)
			: [draft({ field: 'counterparty', text: '' })]
	);
	let submitting = $state(false);
	// svelte-ignore state_referenced_locally
	let preview = $state(serverPreview);
	let previewState = $state<'idle' | 'loading' | 'failed'>('idle');
	/** Match counts by rule key, so removing a rule never shows its neighbour's count. */
	// svelte-ignore state_referenced_locally
	let counts = $state(countsFor(rules, preview));

	function countsFor(list: DraftRule[], result: RulePreview | null) {
		return new Map(result ? list.map((r, i) => [r.key, result.ruleCounts[i]]) : []);
	}

	const plainRules = $derived(rules.map(({ field, text }) => ({ field, text })));
	const rulesKey = $derived(JSON.stringify(plainRules));
	const dirty = $derived(
		rulesKey !== JSON.stringify(saved.map(({ field, text }) => ({ field, text })))
	);
	const hasRuleText = $derived(rules.some((r) => r.text.trim() !== ''));

	// Re-run the preview a moment after typing stops; drop answers to older requests.
	// The server rendered the preview for the rules the form opened with.
	// svelte-ignore state_referenced_locally
	let shownKey = preview ? JSON.stringify(rules.map(({ field, text }) => ({ field, text }))) : '';
	let sequence = 0;
	$effect(() => {
		const key = rulesKey;
		if (accountId === null) return;
		const mine = ++sequence;
		if (key === shownKey) {
			previewState = 'idle';
			return;
		}
		previewState = 'loading';
		const sent = rules.slice();
		const timer = setTimeout(async () => {
			try {
				const res = await fetch('/tags/preview', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ accountId, tagId, rules: JSON.parse(key) })
				});
				if (!res.ok) throw new Error(String(res.status));
				const next = (await res.json()) as RulePreview;
				if (mine !== sequence) return;
				preview = next;
				counts = countsFor(sent, next);
				shownKey = key;
				previewState = 'idle';
			} catch {
				if (mine === sequence) previewState = 'failed';
			}
		}, 250);
		return () => clearTimeout(timer);
	});

	// After a refused save, put the cursor where the problem is.
	$effect(() => {
		if (!error) return;
		const target =
			error.code === 'rule_empty' || error.code === 'rule_long'
				? `#rule-text-${rules[error.index]?.key}`
				: error.code === 'rules_many'
					? null
					: '#tag-name';
		if (target) document.querySelector<HTMLInputElement>(target)?.focus();
	});

	function addRule() {
		rules.push(draft({ field: rules.at(-1)?.field ?? 'counterparty', text: '' }));
		queueMicrotask(() =>
			document.querySelector<HTMLInputElement>(`#rule-text-${rules.at(-1)!.key}`)?.focus()
		);
	}

	function removeRule(index: number) {
		rules.splice(index, 1);
	}

	const counterparty = (row: RulePreview['rows'][number]) =>
		(incoming(row) ? row.payer : row.payee) || m.unknown_counterparty();

	/** Too narrow (nothing) or too wide (everything): both deserve a second look. */
	const suspicious = (rule: DraftRule) => {
		const count = counts.get(rule.key);
		if (!preview || count === undefined) return false;
		return count === 0 || (count === preview.total && preview.total > 1);
	};

	const matchText = (rule: DraftRule) => {
		const count = counts.get(rule.key);
		if (!preview || preview.total === 0 || count === undefined || !rule.text.trim()) return '';
		if (count === preview.total && preview.total > 1) return m.rule_matches_all();
		return ruleMatchCount(count);
	};

	const inputClass =
		'w-full rounded-[3px] bg-sheet text-[0.95rem] text-ink placeholder:text-ink-soft focus:border-band focus:ring-1 focus:ring-band';
	const borderClass = (invalid: boolean) => (invalid ? 'border-danger' : 'border-rule-strong');
</script>

<form
	method="POST"
	{action}
	class="sheet"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<div class="p-5 sm:p-6">
		{#if error}
			<div
				role="alert"
				class="mb-5 flex items-start gap-2 rounded-[3px] border border-danger-rule bg-danger-tint px-4 py-3 text-sm"
			>
				<CircleAlert class="mt-px size-4 shrink-0 text-danger" aria-hidden="true" />
				<div>
					<p class="font-semibold text-danger">{m.tag_error_title()}</p>
					<p class="mt-0.5">{tagErrorMessage(error)}</p>
				</div>
			</div>
		{/if}

		<label for="tag-name" class="block font-medium">{m.tag_name_label()}</label>
		<p id="tag-name-hint" class="mt-0.5 text-sm text-ink-soft">{m.tag_name_hint()}</p>
		<input
			id="tag-name"
			name="name"
			type="text"
			required
			maxlength="60"
			autocomplete="off"
			bind:value={name}
			aria-describedby="tag-name-hint"
			aria-invalid={error?.code === 'name_empty' ||
				error?.code === 'name_long' ||
				error?.code === 'name_taken'}
			class="mt-2 max-w-md {inputClass} {borderClass(
				error?.code === 'name_empty' || error?.code === 'name_long' || error?.code === 'name_taken'
			)}"
		/>
	</div>

	<fieldset class="border-t border-rule" aria-labelledby="rules-heading">
		<div class="px-5 pt-5 sm:px-6">
			<h2 id="rules-heading" class="font-semibold">{m.tag_rules_title()}</h2>
			<p class="mt-0.5 max-w-prose text-sm text-ink-soft">{m.tag_rules_hint()}</p>
		</div>

		<div
			class="mt-4 hidden grid-cols-[11rem_auto_minmax(0,1fr)_9rem_2rem] gap-x-3 border-b border-rule-strong px-6 pb-2 text-sm font-medium text-ink-soft sm:grid"
			aria-hidden="true"
		>
			<span>{m.rule_col_field()}</span>
			<span class="invisible">{m.rule_contains()}</span>
			<span>{m.rule_col_text()}</span>
			<span class="text-right">{m.rule_col_matches()}</span>
			<span></span>
		</div>

		{#if rules.length === 0}
			<p class="mt-4 border-b border-rule px-5 pb-4 text-sm text-ink-soft sm:mt-0 sm:px-6 sm:pt-4">
				{m.tag_rules_empty()}
			</p>
		{/if}

		<ol class="mt-3 sm:mt-0">
			{#each rules as rule, i (rule.key)}
				{@const invalid =
					(error?.code === 'rule_empty' || error?.code === 'rule_long') && error.index === i}
				<li
					class="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-x-3 gap-y-2 border-b border-rule px-5 py-3 sm:grid-cols-[11rem_auto_minmax(0,1fr)_9rem_2rem] sm:px-6 sm:py-2.5"
				>
					<select
						name="field"
						bind:value={rule.field}
						aria-label={m.rule_field_label({ n: i + 1 })}
						class="{inputClass} {borderClass(false)} py-1.5"
					>
						{#each RULE_FIELDS as field (field)}
							<option value={field}>{fieldLabel(field)}</option>
						{/each}
					</select>
					<span
						class="col-start-1 row-start-2 text-sm text-ink-soft sm:col-start-auto sm:row-start-auto"
					>
						{m.rule_contains()}
					</span>
					<input
						id="rule-text-{rule.key}"
						name="text"
						type="text"
						maxlength="200"
						autocomplete="off"
						spellcheck="false"
						bind:value={rule.text}
						placeholder={m.rule_text_placeholder()}
						aria-label={m.rule_text_label({ n: i + 1 })}
						aria-invalid={invalid}
						aria-describedby="rule-count-{rule.key}"
						class="col-span-2 row-start-3 py-1.5 sm:col-span-1 sm:row-start-auto {inputClass} {borderClass(
							invalid
						)}"
					/>
					<span
						id="rule-count-{rule.key}"
						class="figures col-start-1 row-start-4 text-sm transition-opacity sm:col-start-auto sm:row-start-auto sm:text-right {suspicious(
							rule
						)
							? 'font-medium text-warn'
							: 'text-ink-soft'} {previewState === 'loading' ? 'opacity-50' : ''}"
					>
						{matchText(rule)}
					</span>
					<button
						type="button"
						onclick={() => removeRule(i)}
						class="col-start-2 row-start-1 inline-flex size-8 items-center justify-center rounded-[3px] text-ink-soft transition-colors hover:bg-ground hover:text-ink sm:col-start-auto sm:row-start-auto"
					>
						<X class="size-4" aria-hidden="true" />
						<span class="sr-only">{m.rule_remove({ n: i + 1 })}</span>
					</button>
				</li>
			{/each}
		</ol>

		<div class="px-5 py-3 sm:px-6">
			<button
				type="button"
				onclick={addRule}
				class="inline-flex items-center gap-1.5 rounded-[3px] border border-rule-strong bg-sheet py-1.5 pr-3 pl-2 text-sm font-medium transition-colors hover:border-ink-soft"
			>
				<Plus class="size-4" aria-hidden="true" />
				{m.rule_add()}
			</button>
		</div>
	</fieldset>

	<div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule px-5 py-4 sm:px-6">
		<button
			type="submit"
			disabled={submitting}
			class="rounded-[3px] bg-band px-5 py-2.5 font-medium text-band-ink transition-colors hover:bg-band-deep disabled:cursor-progress disabled:opacity-70"
		>
			{submitLabel}
		</button>
	</div>
</form>

<section aria-labelledby="preview-heading" class="sheet">
	<div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 pt-5 sm:px-6">
		<h2 id="preview-heading" class="font-semibold">{m.preview_title()}</h2>
		<p class="text-sm text-ink-soft" aria-live="polite">
			{#if previewState === 'loading'}
				{m.preview_updating()}…
			{:else if previewState === 'failed'}
				<span class="text-danger">{m.preview_failed()}</span>
			{:else if dirty && preview}
				{m.preview_unsaved()}
			{/if}
		</p>
	</div>

	{#if !preview}
		<p class="px-5 pt-2 pb-6 text-ink-soft sm:px-6">
			{accountId === null ? m.preview_no_data() : ''}
		</p>
	{:else if preview.total === 0}
		<p class="px-5 pt-2 pb-6 text-ink-soft sm:px-6">{m.preview_no_data()}</p>
	{:else if !hasRuleText}
		<p class="px-5 pt-2 pb-6 text-ink-soft sm:px-6">{m.preview_no_rules()}</p>
	{:else}
		<dl
			class="figures mt-2 flex flex-wrap gap-x-8 gap-y-1 px-5 text-sm sm:px-6 {previewState ===
			'loading'
				? 'opacity-60'
				: ''} transition-opacity"
		>
			<div>
				<dt class="sr-only">{m.col_transactions()}</dt>
				<dd class="font-medium">
					{m.preview_summary({ count: preview.count, total: preview.total })}
				</dd>
			</div>
			<div class="flex gap-2">
				<dt class="text-ink-soft">{m.statement_in()}</dt>
				<dd>{money(preview.inCents, 'always')}</dd>
			</div>
			<div class="flex gap-2">
				<dt class="text-ink-soft">{m.statement_out()}</dt>
				<dd class={preview.outCents < 0 ? 'text-debit' : ''}>
					{money(preview.outCents, 'always')}
				</dd>
			</div>
		</dl>

		{#if preview.count === 0}
			<p class="px-5 pt-4 pb-6 text-ink-soft sm:px-6">{m.preview_none()}</p>
		{:else}
			<table
				class="mt-3 w-full border-collapse text-[0.95rem] {previewState === 'loading'
					? 'opacity-60'
					: ''} transition-opacity"
			>
				<thead>
					<tr class="border-b border-rule-strong text-left text-sm text-ink-soft">
						<th scope="col" class="hidden w-24 py-2 pl-6 font-medium sm:table-cell">
							{m.col_date()}
						</th>
						<th scope="col" class="py-2 pl-5 font-medium sm:pl-4">{m.col_counterparty()}</th>
						<th scope="col" class="w-px py-2 pr-5 text-right font-medium whitespace-nowrap sm:pr-6">
							{m.col_amount()}
						</th>
					</tr>
				</thead>
				<tbody>
					{#each preview.rows as row (row.id)}
						<tr class="border-b border-rule align-top last:border-0">
							<td class="hidden py-2.5 pl-6 whitespace-nowrap text-ink-soft sm:table-cell">
								{listDate(row.bookingDate)}
							</td>
							<td class="max-w-0 py-2.5 pl-5 sm:pl-4">
								<span class="block truncate font-medium">{counterparty(row)}</span>
								<span class="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-ink-soft">
									<span class="min-w-0 truncate">
										<span class="sm:hidden">{listDate(row.bookingDate)} ·&nbsp;</span
										>{row.purpose || m.no_purpose()}
									</span>
									<span class="flex flex-wrap gap-1">
										<span class="sr-only">{m.row_tags()}:</span>
										<TagChip name={name.trim() || m.tag_new_title()} marked />
										{#each row.otherTags as other (other.id)}
											<TagChip name={other.name} />
										{/each}
									</span>
								</span>
							</td>
							<td
								class="py-2.5 pr-5 pl-4 text-right font-medium whitespace-nowrap sm:pr-6 {row.amountCents <
								0
									? 'text-debit'
									: ''}"
							>
								{money(row.amountCents, 'always')}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if preview.count > preview.rows.length}
				<p class="border-t border-rule px-5 py-3 text-sm text-ink-soft sm:px-6">
					{m.preview_newest({ shown: preview.rows.length })}
				</p>
			{/if}
		{/if}
	{/if}
</section>
