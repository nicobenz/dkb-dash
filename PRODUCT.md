# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individuals who bank with DKB (Deutsche Kreditbank) and want a clearer view of their own finances than the bank's portal gives. Primary context: a single person reviewing their accounts and card transactions on their own machine. English and German speakers.

## Product Purpose

An open-source personal finance dashboard over DKB transaction data, offering the dashboard functionality DKB's own portal lacks: balances, spending, filtering, trends, and category breakdowns from imported exports. Success is the owner understanding their spending habits without handing data to a third party.

## Positioning

Data enters only through the user's own DKB CSV exports and stays on a server they run. No bank credentials, no aggregator, no cloud, no account with any third party. Fully open source and user-rule-based categorization of the bank's own strings.

## Operating Context

User downloads CSV exports from DKB online banking and imports them into the app. Data is stored in Postgres via Drizzle. Distributed as an open-source Docker image published on ghcr; users self-host the full-stack app with an attached Postgres via docker compose (SvelteKit node adapter). Single-user.

## Capabilities and Constraints

- Input: DKB CSV import (live bank sync / FinTS / PSD2 is not planned; may be revisited).
- Stack in place: SvelteKit, Svelte, Tailwind (typography, forms), Drizzle + PostgreSQL (postgres.js), Paraglide i18n (en, de), Vitest, Playwright.
- UI is English-only during early development to keep iteration and testing simple; German localization via Paraglide comes later, at which point the UI must be fully localized in both (German banking terms and formats where appropriate: EUR, dd.mm.yyyy).
- Categorization: users define categories and assign strings found in CSV fields (e.g. payee, purpose text) to them, so matching transactions fall into the category automatically.
- Insights: filtering, trends over time, spending breakdowns by category.
- Everything local and OSS: no cloud services, no telemetry, no external calls at runtime (fonts, analytics, CDNs included); all dependencies open source.
- Undecided: authentication (single-user self-hosted may not need it), categorization approach, multi-account handling.

## Evidence on Hand

No real data, sample CSVs, brand assets, or copy exist yet. Do not fabricate account figures or DKB branding; the project is unaffiliated with DKB unless stated otherwise.

## Product Principles

- Privacy by architecture: nothing leaves the user's server; the UI makes no external requests.
- Open source and easy to self-host: one docker compose up, a clear first-run experience for people running their own server.
- User-owned categorization: rules are transparent and editable by the user, never opaque magic.
- Trustworthy numbers: exact, reconcilable with the bank statement; never approximate silently.
- Import is the front door: making CSV import painless and repeatable matters most.
- Bilingual in the long run: English first while the product takes shape; German joins as an equal citizen once the UI settles.
- Calm and legible: a tool for regular check-ins, not engagement.

## Accessibility & Inclusion

No product-specific standard established; default to WCAG AA.
