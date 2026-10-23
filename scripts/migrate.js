// Applies the SQL migrations in ./drizzle at container start. Plain Node, no dev tooling,
// so the production image can run it with only runtime dependencies installed.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
try {
	await migrate(drizzle(client), {
		migrationsFolder: new URL('../drizzle', import.meta.url).pathname
	});
	console.log('Database is up to date.');
} finally {
	await client.end();
}
