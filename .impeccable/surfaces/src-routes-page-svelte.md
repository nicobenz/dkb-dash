---
version: 1
slug: "src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets: ["src/routes/+layout.svelte","src/routes/import/+page.svelte"]
---

# Surface brief: app shell, dashboard and import

Scope: the app shell, the dashboard (`/`) and the import flow (`/import`). Visitor mode: **Operate**.
Audience and job: a self-hoster checking their DKB Girokonto on a regular, unhurried check-in; import a CSV, then see where the month stands and trust the figures. Full brief: `docs/briefs/basic-setup.md`.
Constraints: English-only UI with every string in Paraglide message keys; no runtime network requests; amounts as integer cents; WCAG AA.

## Direction contract

THESIS: The month is a bank statement: it opens on the old balance, lists what moved, and closes on the new one, checked against the bank's own figure. The app refuses the category default of four KPI tiles over a donut; the only headline is the statement equation.

OWN-WORLD: Cool printout-grey ground, white statement sheets ruled with hairlines, blue-black ink, a deep statement-blue shell band that also carries selection. Outgoing amounts in red ink with a true minus; incoming in ink with a plus. Fira Sans (Spiekermann's workhorse) with tabular figures everywhere; Fira Mono only for IBANs and references. Square-ish corners (2–4px), no shadows beyond a single soft sheet lift.

STORY: The visitor sees the month's opening balance, money in, money out and closing balance, reads that it matches the bank, scans the transactions with a running balance, and imports the next CSV after previewing exactly what will change.

FIRST VIEWPORT: Statement-blue top band with product name, Overview / Import nav and account IBAN. Below: month heading with previous/next controls; then the statement equation row across the full content width at display size; then the 12-month balance chart; then the start of the month's transaction table, opening with an "Opening balance" row. Primary action (Import CSV) sits in the band.

FORM: Statement (Kontoauszug), candidate 1 of 7 on the ordered list (user's pick over the assigned candidate 3). seed:1a46f659696ace89
Signature interaction: the statement bracket, with the reconciled mark against the bank's "Kontostand" line; the transaction table repeats the bracket with opening and closing balance rows and a running balance column. Motion grammar: one moment, the figures settling in on month change (short fade and 4px rise, ease-out, off under reduced motion).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
