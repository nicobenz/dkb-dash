import { m } from '#lib/paraglide/messages.js';
import type { ParseFailure } from '#lib/server/csv/dkb-giro.js';

export type ImportError = ParseFailure | { code: 'no_file' } | { code: 'too_large' };

export function importErrorMessage(error: ImportError): string {
	switch (error.code) {
		case 'no_file':
			return m.import_error_no_file();
		case 'too_large':
			return m.import_error_too_large();
		case 'empty':
			return m.import_error_empty();
		case 'not_text':
			return m.import_error_not_text();
		case 'no_account_line':
			return m.import_error_no_account_line();
		case 'no_balance_line':
			return m.import_error_no_balance_line();
		case 'unknown_layout':
			return m.import_error_unknown_layout({ columns: error.missing.join(', ') });
		default:
			return m.import_error_title();
	}
}
