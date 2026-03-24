# Session — 2026-03-24

## What was done

### Data Explorer table — full overhaul
- Restored old HTML table layout: two-row grouped headers (`rowspan` for User/Days Active,
  colspan group labels: ⚡ Copilot Activity / Lines of Code / Estimated Value)
- Subtle background tints per column group (indigo for Generations, green for LoC, blue for Value)
- Net Lines now shows `+` prefix for positive values
- Dropped Acceptances and Accept Rate columns from the table (9 columns, not 11) — cleaner layout
- Default sort changed from `generations` to `netLines`
- Added two-line explanation below the table title clarifying why Generations and Lines Added
  can diverge (trigger count vs actual code output, dismissed suggestions, agent mode differences)

### Insights panel
- **Power Users** subtitle rewritten — now clarifies this measures trigger frequency, not efficiency
  or real value ("high usage can mean deep adoption or frequent dismissals")
- **Spotlight Users** (new insight card) — top 5 users by lines added via Copilot; `Award` icon;
  subtitle explains these are users where AI is visibly producing real output
- Registered `Award` icon in `InsightCard.jsx` icon map

### Value semantics fix
- **Total Value** changed from `(linesAdded - linesDeleted) × rate` to `(linesAdded + linesDeleted) × rate`
- Renamed "Net Value" → "Total Value" throughout (DataTable, KPI section, CSV export)
- Both Value Added and Value Deleted now represent developer time saved — Copilot-assisted deletion
  (refactors, dead code removal) is as valuable as writing new code
- Total Value is always ≥ 0; column always rendered green

### Export separation
- Header "Export" button now uses `buildRawRecordsCSV` (per-user per-day, no aggregation)
- DataTable CSV button uses `buildDataCSV` (aggregated per user, matches 9-column table view)
- `buildDataCSV` updated to include Days Active and all three value columns (matched the table)
- Added `buildRawRecordsCSV` to `app/domain/export/csv.js`

### Documentation updates
- `docs/architecture.md` — added full Aggregation Model section (two-stage diagram, raw vs aggregated
  table, merge strategy), Footer in component tree, dark/light mode section
- `docs/development.md` — Footer in project structure, dark/light mode section, icon registration guide
- `docs/testing.md` — updated test counts (95 unit, 6 insight types)
- `docs/deployment.md` — updated CI pipeline diagram (95 unit tests)
- `README.md` — added CI test badge alongside AGPLv3 and demo badges; updated insights + table bullets

### `docs/data.md` — new comprehensive data reference
- Full NDJSON schema with field-by-field explanations
- Key distinctions: `loc_suggested` vs `loc_added`, why `active_time_minutes` is always 0,
  why acceptance rate doesn't apply to agent/chat mode
- All feature keys with human labels and descriptions
- Deduplication / merge strategy across overlapping 28-day exports
- Two-stage aggregation model with a table showing which view uses which source
- All 14 charts: type, data source, what to read from each
- Data Explorer column-by-column breakdown
- Inline "why generations ≠ lines added" explanation
- Value calculation formula, both configurable parameters, defaults, and caveats
- All 6 insight cards with exact thresholds and caveats
- Export paths table
- `docs/README.md` and main `README.md` updated to link `data.md` as first entry in doc tables

### Other
- Added `*.png`, `*.jpg`, `*.jpeg` to `.gitignore`
- Deleted `docs/_config.yml` (unnecessary)

## Decisions made

- Dropped the two-row flat header experiment — alignment was visually odd. Reverted to `rowspan`/`colspan` matching old HTML.
- Removed Acceptances and Accept Rate from Data Explorer — 9-column layout is much more readable.
- Spotlight Users uses `linesAdded` (not `netLines`) — refactors can make netLines negative while real output is high.
- Power Users kept as-is — still useful, just needed clearer label about what it means.
- Total Value = added + deleted (not net) — deletion is equally valuable work; a negative net lines day is fine.
- `buildRawRecordsCSV` introduced as a separate function so the header CSV and table CSV paths are independent.

## Fixes applied

- `rowSpan` + `verticalAlign: bottom` on User/Days Active headers correctly aligns with second header row
- E2E test: `getByText('Lines of Code')` strict mode violation — added `.first()` (now appears in both KPI section and table header)
- E2E test: row count `3 → 4` — two-row header means 4 rows total (2 header + 2 data)
- Unit test: `buildDataCSV` header assertion `'Net Value'` → `'Total Value'`
- Removed orphaned `SORT_COLS` constant that was defined but never used

## Unfinished / follow-up

- **Light mode chart fix** — implemented (MutationObserver, `getChartColors()`), no automated test covers it. Manual check when switching themes.
- **`active_time_minutes`** — absent from current API exports; defaults to 0. If GitHub adds it back, the parser already handles it — charts and KPIs would need new entries.

## Commits

- `461b516` add docs/data.md — full reference for data points, charts, table, insights, value calc
- `42229d6` update docs + README for session changes
- `2bb4a01` treat deleted lines as positive value, not a cost
- `0133693` fix tests, align CSV export with table, document aggregation model
- `e1a8757` overhaul data explorer table + add Spotlight Users insight
- `81feb31` aggregate data explorer by user, drop date column
- `4a2dd6b` extract Footer component, make header and footer fixed/sticky
- `0e644a1` add copyright footer to dashboard and upload screen
- `18fa6ad` add light mode with dark/light toggle
