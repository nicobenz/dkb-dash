---
name: dkb-dash
description: A self-hosted DKB account dashboard that reads each month as a bank statement.
colors:
  ground: "oklch(0.955 0.007 250)"
  sheet: "oklch(0.995 0.002 250)"
  ink: "oklch(0.25 0.035 262)"
  ink-soft: "oklch(0.47 0.03 262)"
  rule: "oklch(0.89 0.01 255)"
  rule-strong: "oklch(0.76 0.018 258)"
  band: "oklch(0.36 0.1 260)"
  band-deep: "oklch(0.3 0.09 261)"
  band-ink: "oklch(0.97 0.012 255)"
  band-soft: "oklch(0.83 0.04 258)"
  select: "oklch(0.93 0.035 258)"
  debit: "oklch(0.5 0.17 27)"
  warn: "oklch(0.5 0.12 65)"
  warn-tint: "oklch(0.965 0.035 85)"
  warn-rule: "oklch(0.8 0.1 80)"
  danger: "oklch(0.5 0.19 27)"
  danger-tint: "oklch(0.965 0.02 25)"
  danger-rule: "oklch(0.8 0.08 25)"
typography:
  display:
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "tnum, lnum"
  figure:
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1.25
    fontFeature: "tnum, lnum"
  headline:
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  table:
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum, lnum"
  label:
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  mono:
    fontFamily: "'Fira Mono', ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
rounded:
  focus: "2px"
  sheet: "3px"
spacing:
  row-y: "10px"
  sheet-x: "20px"
  sheet-x-wide: "24px"
  stack: "24px"
  section: "48px"
  container: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.band}"
    textColor: "{colors.band-ink}"
    rounded: "{rounded.sheet}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.band-deep}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "10px 16px"
  nav-item:
    textColor: "{colors.band-soft}"
    rounded: "{rounded.sheet}"
    padding: "6px 12px"
  nav-item-active:
    backgroundColor: "{colors.band-deep}"
    textColor: "{colors.band-ink}"
  sheet:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  notice-reconciled:
    backgroundColor: "{colors.select}"
    textColor: "{colors.band}"
    padding: "12px 20px"
  notice-warn:
    backgroundColor: "{colors.warn-tint}"
    textColor: "{colors.warn}"
    rounded: "{rounded.sheet}"
    padding: "12px 16px"
  notice-danger:
    backgroundColor: "{colors.danger-tint}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sheet}"
    padding: "12px 16px"
---

# Design System: dkb-dash

## Overview

**Creative North Star: "The Kontoauszug"**

Every surface is a bank statement printout: white sheets laid on a cool printout-grey desk, ruled in hairlines, set in blue-black ink. A deep statement-blue band runs across the top like the bank's letterhead and is the only saturated surface on the screen. The headline of any view is a figure, not a graphic; the month opens on the old balance, lists what moved, and closes on the new one, and the visual system exists to make those numbers read as exact and checkable.

Density is that of a printed statement: one column of sheets stacked with even gaps, tables ruled row by row, generous but not airy. Color carries meaning, never decoration. Blue means the bank's voice (band, selection, the reconciled mark, the primary action); red means money leaving; amber means the figures disagree. Everything else is ink and paper.

Motion has one moment: when the month changes, the statement figures settle in with a short fade and a 4px rise. Nothing else animates beyond colour transitions on hover.

**Key Characteristics:**
- Cool grey ground, white hairline-ruled sheets, blue-black ink.
- One deep statement-blue for the band, selection, focus, and primary action.
- Fira Sans throughout with tabular lining figures; Fira Mono only for IBANs, references, and filenames.
- Square-ish 3px corners; a single soft lift under sheets and nothing else.
- Outgoing amounts in red ink with a true minus (U+2212); incoming in ink with a plus.

## Colors

A near-monochrome blue-grey paper palette with one deep statement blue and red ink reserved for debits.

### Primary
- **Statement Blue** (band): the top shell band, the primary button, the reconciled mark and its icon, inline text links, the chart line and highlight points, focus outline, caret, and form accent colour.
- **Letterhead Navy** (band-deep): hover state of the primary button, active nav item and the account select inside the band.
- **Band Paper** (band-ink): text on the band and on primary buttons.
- **Band Grey-Blue** (band-soft): resting nav links and secondary labels inside the band (account kind).
- **Selection Wash** (select): text selection, the reconciled notice strip (at 50%), the active drop zone and the chart's current-month span (at 60%).

### Secondary
- **Debit Red** (debit): outgoing amounts, the money-out figure and its minus operator. Used for amounts only.

### Tertiary
- **Mismatch Amber** (warn, warn-tint, warn-rule): the "does not match the bank" strip and new-account notices. Tint is the fill, rule the 1px border, warn the icon and bold lead.
- **Error Red** (danger, danger-tint, danger-rule): import failures and rejected-row counts. Same tint/rule/ink triad as amber.

### Neutral
- **Printout Grey** (ground): page background, file-name chips, row hover (at 60%) and expanded row detail (at 50%).
- **Statement White** (sheet): every sheet, secondary button fill, tooltip fill.
- **Blue-Black Ink** (ink): all primary text and figures; also the 2px closing rule.
- **Faded Ink** (ink-soft): labels, dates, purpose lines, running balance, axis ticks, footer.
- **Hairline** (rule): sheet borders, row dividers, chart grid, footer rule.
- **Ruled Line** (rule-strong): table header underline, secondary button border, dashed drop zone border, scrollbar thumb.

### Named Rules
**The Bank's Voice Rule.** Statement Blue is the only saturated colour on a calm screen; it marks the band, the one primary action, and the reconciled state. Never use it as a decorative fill or for a second competing action.

**The Red Ink Rule.** Debit Red is for outgoing amounts. Errors use Error Red in its tint/rule/ink triad; amounts never use the tint.

## Typography

**Display Font:** Fira Sans (with ui-sans-serif, system-ui)
**Body Font:** Fira Sans (with ui-sans-serif, system-ui)
**Label/Mono Font:** Fira Mono (with ui-monospace)

**Character:** Spiekermann's workhorse sans in 400/500/600 only, self-hosted via Fontsource. Every table and every figure block sets `tabular-nums lining-nums`, so columns of euros align like a printout.

### Hierarchy
- **Display** (600, 2rem → 2.25rem → 3rem at lg, 1.25): the closing balance in the statement bracket. One per screen.
- **Figure** (500, 1.75rem → 2rem → 2.5rem at lg, 1.25): opening balance, money in, money out in the bracket.
- **Headline** (600, 1.75rem → 2rem at sm, 1.25, -0.025em): page h1 (month name, Import CSV, Review import). Empty and error states drop to 1.5rem.
- **Title** (600, 1rem): sheet headings (Balance, Transactions, Import history, preview).
- **Body** (400, 1rem, 1.5): prose, capped at 65ch (`max-w-prose`).
- **Table** (400 / 500 for counterparty and amount, 0.95rem): transaction rows; header cells drop to Label in 500.
- **Label** (400, 0.875rem, ink-soft): field labels, dates, captions, notices. Sentence case, no tracking, never uppercase.
- **Mono** (Fira Mono 400, 0.875rem / 0.75rem in history): IBANs, customer and mandate references, selected filename.

### Named Rules
**The Tabular Figures Rule.** Any element showing money or counts carries tabular lining numerals (the `figures` utility or a `table`). Amounts are right-aligned, signed with + or a true minus (U+2212), never a hyphen.

**The Mono for Identifiers Rule.** Fira Mono is for strings the bank issues (IBAN, references) and filenames. Amounts are never mono.

## Layout

A single centred column, max 72rem, with 16px side padding rising to 24px at sm. Main content gets 32px top padding (40px at sm). Sheets stack in a grid with a 24px gap; independent page sections separate by 48px. Inside a sheet, content insets 20px (24px at sm for tables and charts), table rows breathe 10px vertically, and the closing row 12px.

Responsive behaviour: the statement bracket is a two-column label-and-figure grid on mobile with the closing balance spanning and ruled above; at lg it becomes a single seven-column equation row (`1fr auto 1fr auto 1fr auto 1.3fr`) with the operators baseline-aligned between figures. The transaction table hides the date column below sm (the date moves into the purpose line) and the running-balance column below md (it moves under the amount). The import page sets the drop zone sheet beside a 20rem how-to aside at lg; the review page puts a sticky 20rem summary column left of the preview. Import history becomes a ruled list below sm.

Breakpoints are Tailwind defaults: sm 640px, md 768px, lg 1024px.

## Elevation & Depth

Flat paper on a desk. Depth comes from the ground/sheet tonal step and 1px hairline borders, plus one barely-there lift (`0 1px 2px oklch(0.3 0.04 260 / 0.06)`) baked into the sheet. Nothing rises on hover. The chart tooltip, as the only floating layer, sits on a sheet fill with a hairline border and a small lift.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 1px 2px oklch(0.3 0.04 260 / 0.06)`): every sheet, always at rest.

### Named Rules
**The Paper Rule.** Surfaces separate by tone and hairline, not shadow. The sheet lift is the system's only shadow token; do not stack, enlarge, or animate it.

## Shapes

Square-ish and printed. Sheets, buttons, nav items, notices, the drop zone, the account select, and chips all share a 3px radius; the focus outline rounds at 2px with a 2px offset. Borders are 1px hairlines; the one heavy line is a 2px ink rule that closes a statement (above the closing balance row, and to the left of the closing figure at lg, above it on mobile), the way a printed statement totals. The drop zone uses a dashed rule-strong border. Lucide line icons at 16px (24px in the drop zone) are the only iconography.

## Components

### Buttons
Plain, printed, and quiet.
- **Shape:** gently squared (3px).
- **Primary:** Statement Blue fill, Band Paper text, weight 500, 10px 20px padding (16px horizontal for the empty-state link with a 16px leading icon). One per view.
- **Hover / Focus:** fill shifts to Letterhead Navy via colour transition; focus is the global 2px Statement Blue outline at 2px offset. Disabled drops to 70% opacity with a progress cursor while submitting.
- **Secondary:** Statement White fill, ink text, 1px Ruled Line border that darkens to Faded Ink on hover. Used for Discard and the previous/next month controls (6px vertical padding, 14px text, chevron icon).
- **Text link:** Statement Blue, weight 500, underlined with 1px thickness and 0.2em offset.

### Cards / Containers
The sheet is the container for everything.
- **Corner Style:** 3px.
- **Background:** Statement White on Printout Grey.
- **Shadow Strategy:** sheet lift only (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 20px, 24px at sm; empty and error sheets use 24px/40px, capped at 42rem.
- **Notice strips:** a sheet can end in a full-bleed strip separated by a hairline (reconciled: Selection Wash at 50% with a blue check; mismatch: amber tint with amber rule). Standalone notices use the tint/rule/ink triad with a 3px radius and a 16px leading icon.

### Inputs / Fields
- **File drop zone:** a label styled as a 3px dashed Ruled Line panel, 40px vertical padding, centred blue file icon; hover darkens the border to Faded Ink, an active drag turns it Statement Blue on Selection Wash at 60%. The real file input is visually hidden.
- **Account select (in band):** Letterhead Navy fill, Band Paper mono text, faint band-soft border at 40%.
- **Focus:** global 2px Statement Blue outline.

### Navigation
- **Shell band:** full-width Statement Blue header; product name in 18px 600 tight-tracked, nav links at 0.95rem, account kind and IBAN right-aligned in mono.
- **Nav items:** Band Grey-Blue at rest, Band Paper on hover; the current page sits on a Letterhead Navy 3px tile with Band Paper text. Items wrap under the name on mobile.
- **Month stepper:** secondary buttons with chevrons and short month names, top-right of the month heading.

### Statement Bracket (signature)
The month's headline is the statement equation: opening balance + money in − money out = closing balance, each with a Label line above (balance date or transaction count) and the figure below. Operators are Faded Ink except the minus in Debit Red. The closing figure is Display weight and sits behind the 2px ink rule. A footer strip reports the reconciliation against the bank's own balance. On month change the figures settle in (fade + 4px rise, 280ms, expo-out, instant under reduced motion).

### Statement Table (signature)
The transaction table repeats the bracket: in date-ascending order it opens on an italic Faded Ink "Opening balance" row and closes on a 600-weight "Closing balance" row under a 2px ink rule, with a running-balance column in Faded Ink. Rows are ruled in hairlines, hover to Printout Grey at 60%, and expand on click (chevron rotates 180°) into a Printout Grey detail grid of label/value pairs with identifiers in mono. Sorting by another key drops the bracket rows and the running balance, since they only hold in statement order.

### Balance Chart
A sheet containing a LayerChart step-after area: Statement Blue 1.75px line, the same blue at 8% fill, hairline horizontal grid only, Faded Ink 12px ticks with compact euro labels, and the current month shaded in Selection Wash at 60%. A visually hidden summary and monthly table stand in for it for assistive tech.

## Do's and Don'ts

### Do:
- **Do** put every view's content on Statement White sheets (1px Hairline, 3px radius, sheet lift) over the Printout Grey ground.
- **Do** set money and counts in tabular lining figures, right-aligned, with + for incoming and a true minus (U+2212) in Debit Red for outgoing.
- **Do** close any statement-like total with a 2px ink rule, as the bracket and the table do.
- **Do** keep Statement Blue for the band, the single primary action, links, focus, and the reconciled state.
- **Do** write labels in sentence case at 0.875rem in Faded Ink.
- **Do** use the tint / rule / ink triad (warn or danger) for notices, with a 16px Lucide icon leading.
- **Do** reserve motion for the figures settling on month change, and switch it off under reduced motion.

### Don't:
- **Don't** open a view on KPI tiles or a donut; the headline is the statement equation.
- **Don't** add shadows beyond the sheet lift, and don't lift elements on hover.
- **Don't** round corners past 3px or use pill shapes.
- **Don't** set amounts in Fira Mono or use a hyphen-minus for negatives.
- **Don't** use Debit Red for anything but outgoing amounts, or Statement Blue as decorative fill.
- **Don't** load fonts, icons, or assets from a CDN; everything is self-hosted.
