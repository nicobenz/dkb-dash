# Shape brief: tags with rules

Status: confirmed. Planning only; no code written yet.

## 1. Job and audience

- The same self-hoster on a regular check-in, wanting to see where their money goes through rules they wrote and can read back.
- Mode: **Operate**. The feature lives inside the established Kontoauszug world (DESIGN.md): sheets, hairlines, ink, statement blue. No new visual direction.

## 2. Outcome and proof

- Primary task: create a tag ("Groceries", "Subscriptions", "Delivery"), add rules to it ("Counterparty contains REWE", "Purpose contains Lidl"), and immediately see which bookings it catches. The dashboard then shows the month's money out per tag, and each booking shows its tags.
- Success: every tag on a booking can be traced to the rule that put it there. Nothing is tagged that the user cannot explain.
- Product-specific truth: the user's own name is the payer on every outgoing row, so a rule on "any field" can catch everything. The live preview is the guard against this, not a hidden heuristic.

## 3. Selected direction

- **Model: tags, not categories.** A booking carries every tag that has at least one matching rule. Several tags per booking is the normal case. Untagged bookings are a visible fact.
- **Rules:** a tag holds several rules; matching any one is enough. A rule is a field + "contains" + a text, case-insensitive. Fields:
  - Counterparty (payee for money out, payer for money in)
  - Purpose (Verwendungszweck)
  - Counterparty IBAN
  - Creditor ID
  - Any text field
- **Live evaluation:** rules apply to all bookings, past and future, evaluated at read time. No stored assignment that can go stale, and no manual per-booking override in this pass. The builder may cache, but a rule edit must show everywhere at once.
- **Tag chip:** the existing file-name chip (3px corner, Printout Grey fill, ink text). No per-tag colours; tags are told apart by name. Statement blue and debit red keep their meaning.
- **Focal moment: the live match preview.** While a rule is edited, the bookings it catches appear below in the statement-table style, with an exact count and in/out totals. Each rule row shows its own match count, so a rule that catches nothing, or catches everything, is obvious. Each caught booking shows all its tags as chips, with the tag being edited marked.
- **Spending by tag (dashboard):** a ruled sheet, not a donut and not tiles.
  - One row per tag: name, booking count, money out in debit red, and share of the month's money out (thin ink-soft bar plus percentage), sorted by amount.
  - **No closing total row and no 2px ink rule.** That rule means "this adds up" in the design system, and tags overlap.
  - **Untagged** sits apart at the foot with its count and amount.
  - Caption: "A booking counts under each of its tags, so tags can add up to more than money out." The real money out stays in the statement bracket above.
- **Tags on rows:** the dashboard transaction table shows each booking's tags as chips, by convention. Display only; no filter in this pass.

## 4. Scope and boundaries

In scope:

- A **Tags** nav item (Overview / Tags / Import).
- `/tags`: list of tags with rule count, all-time booking count, and this month's money out.
- `/tags/new` and `/tags/[id]`: name, rules, live preview, delete.
- Spending-by-tag sheet on the dashboard, between the balance chart and the transactions.
- Tag chips on transaction rows (and in the expanded row detail).
- Database: `tag` (unique name) and `tag_rule` (tag, field, text), additive migration via drizzle-kit.

Out of scope (anti-goals):

- Filtering the table by tag, creating a rule from a booking.
- AND conditions, amount or direction filters, regex, fuzzy or accent-insensitive matching.
- Tag hierarchy, budgets, per-tag trends, auto-suggested rules, per-tag colours.
- Netting refunds: the breakdown counts outgoing bookings only. Incoming tagged bookings appear in the tag's preview totals.
- Any total that sums the tags.

Untouched: the statement bracket, reconciliation, the import flow, and the table's opening/closing balance rows and running balance.

## 5. States and ranges

- Ranges: 5–30 tags, 1–20 rules each, up to about 10k bookings. A booking typically has 0–3 tags.
- Preview: server-side with debounce; first 50 rows plus exact count and totals.
- **No tags:** the dashboard sheet shows one line and a link to create a tag; rows show no chips.
- **No bookings:** the tags page still works; the preview says to import first.
- **Validation:** rule text can't be empty; tag names are unique, case-insensitive.
- **Delete:** confirmation names how many bookings lose the tag.
- **A month with no tagged spending:** everything shows as Untagged.
- **Long strings:** long tag names truncate in the breakdown; chips on rows wrap within the purpose cell and never widen the table. Full names on row expand.

## 6. Interaction and layout

- `/tags/[id]`: editor sheet (name, rules) with the preview sheet below. Each rule is a row: field select, "contains", text input, match count, remove. "Add rule" at the end. One primary action: Save.
- Below sm, rule rows stack the field above the text input.
- Dashboard order: month stepper, statement bracket, balance chart, spending by tag, transactions.
- Chips sit on the purpose line of a row, after the purpose text, so the amount and running-balance columns stay aligned.

## 7. Constraints and open decisions

- Every string is a Paraglide message key; English only for now. Amounts in integer cents. WCAG AA: the share bar is decorative and the figure carries the value; chips are text, not colour.
- No runtime network requests.
- UI term: **Tags** throughout.
