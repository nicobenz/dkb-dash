import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	DKB_DASH_VERSION: {
		description: 'The released version, set in the published Docker image. Unset in development.',
		schema: (value) => value || undefined
	}
});
