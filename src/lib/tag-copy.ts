import { m } from '#lib/paraglide/messages.js';
import type { RuleField } from '#lib/tags.js';
import type { TagInputError } from '#lib/server/tags.js';

export const fieldLabel = (field: RuleField) =>
	({
		counterparty: m.field_counterparty,
		purpose: m.field_purpose,
		iban: m.field_iban,
		creditor: m.field_creditor,
		any: m.field_any
	})[field]();

export const ruleMatchCount = (count: number) =>
	count === 0
		? m.rule_matches_none()
		: count === 1
			? m.rule_matches_one()
			: m.rule_matches_other({ count });

export const ruleCount = (count: number) =>
	count === 1 ? m.tags_rule_count_one() : m.tags_rule_count_other({ count });

export const transactionCount = (count: number) =>
	count === 1 ? m.statement_count_one() : m.statement_count_other({ count });

export function tagErrorMessage(error: TagInputError) {
	switch (error.code) {
		case 'name_empty':
			return m.tag_error_name_empty();
		case 'name_long':
			return m.tag_error_name_long();
		case 'name_taken':
			return m.tag_error_name_taken();
		case 'rules_many':
			return m.tag_error_rules_many();
		case 'rule_empty':
			return m.tag_error_rule_empty({ n: error.index + 1 });
		case 'rule_long':
			return m.tag_error_rule_long({ n: error.index + 1 });
	}
}
