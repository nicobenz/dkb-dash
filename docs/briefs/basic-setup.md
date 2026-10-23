# Shape brief: basic setup (import, database, dashboard)

Status: confirmed. Planning only; no code written yet.

## 1. Job and audience

- One person who banks with DKB, on their own self-hosted instance, doing a regular check-in (weekly or monthly). They are calm, not in a hurry, and want to trust the numbers.
- Mode: **Operate**. The app shell, import flow and dashboard are working screens: scanability and exactness come before expression.

## 2. Outcome and proof

- Primary task: get a DKB Girokonto CSV into the database without worry, then see where the month stands.
- Success: after importing, the dashboard balance matches the bank's own `Kontostand vom …` line from the file, to the cent, and the app says so. A re-import of an overlapping export adds only what is new.
- Real evidence: the export format in `.csv-export.example`. No real figures exist; any demo or seed data is labeled synthetic.

## 3. Selected direction: Statement (Kontoauszug)

- **World:** the printed bank statement. It lends four things only: type, palette, density, and one signature move. Navigation and controls stay standard web controls.
- **Type:** a self-hosted workhorse grotesk with tabular figures for all UI and amounts; a monospace face only where the content really is code-like (IBAN, references). No terminal costume.
- **Palette:** a cool printout-grey ground (explicitly not cream), blue-black ink for text and figures, a committed statement-blue for the shell band and selection, outgoing amounts in a statement red ink, incoming in ink. Status colours (error, warning) are reserved for real states and always carry an icon too.
- **Density:** statement-dense rows, generous gutters between blocks.
- **Signature move (focal moment):** the month as a statement bracket. The dashboard opens on one equation row: **Opening balance + Money in − Money out = Closing balance**. When the closing balance matches the bank's balance from the latest import, it shows a `reconciled` mark. On a mismatch it states the exact difference, with no silent correction.
- **Build path:** code-led (Operate surface). The direction contract and DESIGN.md come at build time, not in this brief.
- **Honest risk:** a familiar register that drifts toward monospace or terminal. The guard is the grotesk/tabular type rule above.
- Roll note: the direction roll ran degraded (roll service blocked by network policy), with no catalog challengers. The roll assigned "Two inks (Überweisungsträger)"; the user picked the Statement direction instead.

## 4. Scope and boundaries

In scope:

- **CSV import** (`/import`): pick or drop a file → parse → **preview** (N new, M already imported, K pending, any rows rejected with reasons) → confirm → result.
- **Database** (Drizzle + Postgres) replacing the scaffold's `task` table:
  - `account`: IBAN (from header line 1), account type label, display name.
  - `import`: account, filename, imported_at, statement balance (cents) and its date, counts.
  - `transaction`: account, import, booking date, value date, status, payer, payee, purpose, type (Eingang/Ausgang), counterparty IBAN, **amount as integer cents**, creditor ID, mandate reference, customer reference, fingerprint.
  - Migrations via drizzle-kit (generate + migrate, not `push`, for self-hosters).
- **Dashboard** (`/`): month switcher, statement bracket, balance-over-time chart, transactions for the selected month.
- A plain transactions page with month filter and text search is in scope only if it costs little beyond the dashboard table. Otherwise it waits.
- App shell: top bar with product name, Dashboard and Import. No language switch yet.

Out of scope (anti-goals):

- Categories and rules, credit card (Visa) exports, multiple-account UI, auth, budgets, any external request at runtime (fonts are self-hosted), DKB branding or the DKB logo.
- Gamification, streaks, "insights" copy, approximate numbers.

## 5. States and ranges

- Data range: a single file holds from a few rows to roughly 2,000 (a year or more of history). Total history: a few years, about 10k rows.
- **First run / empty:** the import is the front door. A short how-to says where to export the CSV in DKB online banking (described in words, no screenshots of DKB), with one primary action.
- **Import errors:** not a CSV; unknown layout (name the missing columns); wrong encoding (older exports may be ISO-8859-1, so detect and convert rather than fail where possible); empty file; IBAN differs from the existing account (ask before creating a second account).
- **Preview:** counts as above, the first rows shown, pending (`Vorgemerkt`) rows called out.
- **Success:** counts, reconciliation result, link to the month just imported.
- **Reconciliation mismatch:** the difference shown in EUR, with the likely cause (a gap between imports).
- **DB unreachable:** a plain server error page that tells a self-hoster what to check (`DATABASE_URL`).
- **Long strings:** purpose texts and payee names truncate in the table, with the full text available on row expand.

## 6. Interaction and layout

- **Dashboard order:**
  1. Month switcher (prev, current, next), defaulting to the latest month with data.
  2. Statement bracket row.
  3. Balance-over-time line chart (last 12 months, selected month highlighted).
  4. The month's transactions: date, counterparty, purpose, amount, sortable by date and amount.
- **Mobile:** the bracket stacks vertically like statement lines; the table becomes rows of counterparty and amount, with date and purpose beneath.
- **Import:** one page, three steps (choose → preview → done). Nothing is written before confirm, and the preview is a server-side parse held until confirm.
- **Feedback:** inline and specific, never toasts that vanish with important numbers in them.

## 7. Constraints and decisions for the builder

Parsing truths (from the sample):

- `;` delimiter, quoted fields, UTF-8.
- Preamble: account line, blank line, balance line, blank line, then a header row with 12 columns.
- Dates as `dd.mm.yy`; amounts as `-1.234,56`. Parse to cents exactly, never via float.

Duplicate detection:

- The fingerprint is a hash of the normalized row fields plus an occurrence index within the file, so two identical coffees on the same day both survive.
- On re-import, compare occurrence counts per fingerprint.

Balance timeline:

- Anchor each import's statement balance at its date and derive the daily balances backwards through booked transactions.
- Pending rows: not stored, only counted in the preview. They change or vanish when booked and would break duplicate detection.

Localization and accessibility:

- **English-only UI for now, with message keys from the start.** Every UI string lives in `messages/en.json` and is used through Paraglide's `m.*()` functions, so German can be added later as `messages/de.json` without touching components. The `de` locale is removed from `project.inlang/settings.json` until then.
- The CSV's German values (`Gebucht`, `Vorgemerkt`, `Eingang`, `Ausgang`) are stored as the bank wrote them and mapped to English labels in the UI.
- Numbers and currency via `Intl` with `en-GB` (EUR); dates in en-GB style, e.g. 23 Oct 2026.
- WCAG AA: the amount sign is never conveyed by colour alone (always `−`/`+`); the chart has a table or text equivalent.

Decisions (confirmed):

- Ship a Dockerfile and `docker-compose.yml` (app + Postgres, migrations run on start) as part of this setup.
- Charts: use a chart library from the start, since charts grow in importance (trends, category breakdowns). Choice: **LayerChart** (MIT, Svelte-native, SVG on d3 scales, Tailwind-friendly, no runtime network calls). The builder pins an exact version compatible with Svelte 5 and themes it from the design tokens rather than shipping library defaults. Fallback if it fights Svelte 5 or SvelteKit 3: Apache ECharts (Apache-2.0, canvas).
