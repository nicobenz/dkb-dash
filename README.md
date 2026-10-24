# dkb-dash

A self-hosted dashboard for your DKB Girokonto. Import the CSV export from DKB online banking and see each month as a statement: opening balance, money in, money out and closing balance, reconciled to the cent against the balance the bank puts in the export.

- **Your data stays with you.** The CSV is read on your server and stored in your own Postgres. No bank credentials, no aggregator, and no requests to anyone else.
- **Safe re-imports.** Overlapping exports are fine: transactions already imported are recognised and skipped, and you see exactly what will change before anything is saved.
- **Figures you can check.** Balances are derived from the bank's own "Kontostand" figure. When two imports don't add up, the dashboard says by how much instead of hiding it.

dkb-dash is an independent open-source project and is not affiliated with DKB AG.

## Run it with Docker

```sh
docker compose up -d
```

Then open http://localhost:3000 and import your first CSV export. Change the database password in `docker-compose.yml` before you expose the app beyond your own machine. dkb-dash has no login yet, so keep it on a private network.

To update, read the [release notes](https://github.com/nicobenz/dkb-dash/releases) first, then pull the new image and restart. Database migrations run when the container starts.

```sh
docker compose pull && docker compose up -d
```

Images are published for `linux/amd64` and `linux/arm64`. To build the image from source instead, run `docker build -t ghcr.io/nicobenz/dkb-dash:latest .` before `docker compose up -d`.

Behind a reverse proxy that terminates TLS, pass `X-Forwarded-Proto` (most proxies do this by default) so form submissions are accepted.

## Getting the CSV

1. Sign in to DKB online banking and open your Girokonto.
2. Open the list of transactions and pick the period you want.
3. Export the list as CSV and choose the file on the Import page.

Only the current Girokonto export format is supported for now. Pending ("Vorgemerkt") transactions are shown in the import preview but not stored; they come in with a later export once the bank has booked them.

## Development

Requirements: Node 22 and a Postgres database.

```sh
cp .env.example .env    # point DATABASE_URL at your database
npm install
npm run db:migrate      # create the tables
npm run dev
```

| Command                                       | What it does                                                    |
| --------------------------------------------- | --------------------------------------------------------------- |
| `npm run check`                               | Type-check Svelte and TypeScript                                |
| `npm run lint`                                | Prettier and ESLint                                             |
| `npm run test:unit -- --run --project server` | Unit tests (CSV parser, money, ledger)                          |
| `npm run test:e2e`                            | Playwright tests against a production build                     |
| `npm run db:generate`                         | Create a migration after changing `src/lib/server/db/schema.ts` |

The UI is English-only for now. Every string lives in `messages/en.json` (Paraglide), so a German translation can be added later by adding `de` to `project.inlang/settings.json` and a `messages/de.json`.

### Project layout

- `src/lib/server/csv/dkb-giro.ts`: parser for the DKB Girokonto export
- `src/lib/server/imports.ts`: preview drafts, duplicate detection and committing imports
- `src/lib/ledger.ts`: balances derived from the bank's balance figures
- `src/routes/`: dashboard (`/`) and import flow (`/import`)
- `drizzle/`: SQL migrations, applied on start by `scripts/migrate.js`
