/** The booking fields a rule can look at. */
export const RULE_FIELDS = ['counterparty', 'purpose', 'iban', 'creditor', 'any'] as const;
export type RuleField = (typeof RULE_FIELDS)[number];

export const isRuleField = (value: unknown): value is RuleField =>
	typeof value === 'string' && (RULE_FIELDS as readonly string[]).includes(value);

export type Rule = { field: RuleField; text: string };
export type Tag = { id: number; name: string; rules: Rule[] };

/** The booking strings rules match against, as the export gives them. */
export type Matchable = {
	payer: string;
	payee: string;
	purpose: string;
	type: string;
	amountCents: number;
	counterpartyIban: string;
	creditorId: string;
	mandateReference: string;
	customerReference: string;
};

export const incoming = (b: Pick<Matchable, 'type' | 'amountCents'>) =>
	b.type === 'Eingang' || b.amountCents > 0;

const fold = (s: string) => s.toLowerCase();
/** IBANs are compared without spaces, so "DE12 3456" finds DE123456… */
const compact = (s: string) => s.replace(/\s+/g, '').toLowerCase();

function haystacks(b: Matchable, field: RuleField): string[] {
	switch (field) {
		case 'counterparty':
			return [incoming(b) ? b.payer : b.payee];
		case 'purpose':
			return [b.purpose];
		case 'iban':
			return [b.counterpartyIban];
		case 'creditor':
			return [b.creditorId];
		case 'any':
			return [
				b.payer,
				b.payee,
				b.purpose,
				b.counterpartyIban,
				b.creditorId,
				b.mandateReference,
				b.customerReference
			];
	}
}

/** A rule matches when its field contains its text, ignoring case. An empty rule matches nothing. */
export function ruleMatches(rule: Rule, b: Matchable): boolean {
	const needle = rule.field === 'iban' ? compact(rule.text) : fold(rule.text.trim());
	if (!needle) return false;
	return haystacks(b, rule.field).some((h) =>
		(rule.field === 'iban' ? compact(h) : fold(h)).includes(needle)
	);
}

/** The first of a tag's rules that catches the booking: the reason the tag is there. */
export const matchingRule = (tag: Pick<Tag, 'rules'>, b: Matchable) =>
	tag.rules.find((r) => ruleMatches(r, b));

/** Every tag with at least one matching rule, in the order given, with the rule that put it there. */
export function tagsFor(tags: Tag[], b: Matchable) {
	const found: { id: number; name: string; rule: Rule }[] = [];
	for (const tag of tags) {
		const rule = matchingRule(tag, b);
		if (rule) found.push({ id: tag.id, name: tag.name, rule });
	}
	return found;
}

export type TagSpending = { id: number; name: string; count: number; outCents: number };

/**
 * Money out per tag for a set of bookings. A booking counts under every tag it carries, so the
 * tags may add up to more than `outCents`; `multiTagged` says how many bookings caused that.
 */
export function spendingByTag(tags: Tag[], bookings: Matchable[]) {
	const rows = new Map<number, TagSpending>(
		tags.map((t) => [t.id, { id: t.id, name: t.name, count: 0, outCents: 0 }])
	);
	let outCents = 0;
	let untaggedCount = 0;
	let untaggedCents = 0;
	let multiTagged = 0;

	for (const b of bookings) {
		if (b.amountCents >= 0) continue;
		outCents += b.amountCents;
		const found = tagsFor(tags, b);
		if (found.length === 0) {
			untaggedCount += 1;
			untaggedCents += b.amountCents;
		}
		if (found.length > 1) multiTagged += 1;
		for (const { id } of found) {
			const row = rows.get(id)!;
			row.count += 1;
			row.outCents += b.amountCents;
		}
	}

	return {
		outCents,
		tags: [...rows.values()]
			.filter((r) => r.count > 0)
			.sort((a, b) => a.outCents - b.outCents || a.name.localeCompare(b.name)),
		untagged: { count: untaggedCount, outCents: untaggedCents },
		multiTagged
	};
}
