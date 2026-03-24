# Data Reference

Everything the dashboard displays comes from the GitHub Copilot Enterprise API's NDJSON export. This page explains every data point, how it flows through the system, what each chart and table column actually measures, and how the value estimate is calculated.

---

## Source data — NDJSON schema

Each line of the export is one JSON record representing a single user's activity for a single day.

### Root fields

| Field | Type | What it means |
|-------|------|---------------|
| `user_login` | string | GitHub username |
| `day` | `YYYY-MM-DD` | Calendar date for this record |
| `report_start_day` / `report_end_day` | string | Rolling window of the export that produced this record |
| `enterprise_id` | string | Your Enterprise identifier |
| `user_id` | number | GitHub user ID |
| `code_generation_activity_count` | number | Number of Copilot **triggers** — every time Copilot generated a suggestion, whether or not it was accepted |
| `code_acceptance_activity_count` | number | Number of suggestions the user **accepted** (Tab / apply) |
| `user_initiated_interaction_count` | number | Explicit user-triggered interactions (Chat sends, agent runs) — not passive completions |
| `loc_suggested_to_add_sum` | number | Lines Copilot **offered** as ghost text or a diff patch |
| `loc_suggested_to_delete_sum` | number | Lines Copilot offered to remove |
| `loc_added_sum` | number | Lines actually **applied** — accepted suggestions that landed in a file |
| `loc_deleted_sum` | number | Lines actually **removed** via Copilot (refactors, rewrites, agent deletions) |
| `used_agent` | boolean | Whether the user used any agent-mode feature that day |
| `used_chat` | boolean | Whether the user opened Chat that day |

**Important distinctions:**

- `loc_suggested_to_add_sum` ≠ `loc_added_sum`. The first is what Copilot showed; the second is what the developer kept. Charts and KPI cards use `loc_added_sum` throughout.
- `active_time_minutes` is **absent** from current API exports. The parser defaults it to `0` — the Active Time column and related calculations are not available.
- The root-level `model` field is **absent**. Model data lives in `totals_by_language_model` and `totals_by_model_feature`.
- Acceptance rate (`code_acceptance_activity_count / code_generation_activity_count`) is only meaningful for **Code Completion** (inline ghost text). Agent mode and Chat do not track acceptances — they write code directly. Expect many records with 0 acceptances even when real work happened.

### Nested arrays

| Field | Granularity | What it captures |
|-------|-------------|-----------------|
| `totals_by_ide` | per IDE | `ide`, `code_generation_activity_count`, `code_acceptance_activity_count` |
| `totals_by_feature` | per feature key | `feature`, `code_generation_activity_count`, `code_acceptance_activity_count` |
| `totals_by_language_feature` | per language × feature | `language`, `feature`, `code_generation_activity_count` |
| `totals_by_language_model` | per language × model | `language`, `model`, `code_generation_activity_count` |
| `totals_by_model_feature` | per model × feature | `model`, `feature`, `code_generation_activity_count` |

### Feature keys

The `feature` field in `totals_by_feature` uses internal API keys. The dashboard maps these to human labels:

| API key | Label | What it is |
|---------|-------|------------|
| `code_completion` | Code Completion | Inline ghost text (Tab to accept) |
| `chat_panel_agent_mode` | Chat · Agent | Agent mode accessed via the Chat panel |
| `chat_panel_ask_mode` | Chat · Ask | Chat Q&A — explains code, suggests, does not write automatically |
| `chat_panel_plan_mode` | Chat · Plan | Plan mode — produces a step-by-step plan before applying changes |
| `chat_panel_custom_mode` | Chat · Custom | User-defined system prompts active |
| `agent_edit` | Edit Mode | Copilot Edits panel — agentic multi-file editing with diff review |
| `agent` | Agent Mode | Fully autonomous: reads files, runs commands, iterates |
| `chat_inline` / `inline_chat` | Inline Chat | ⌘I / Ctrl+I — in-editor chat for localised edits |
| `chat` | Copilot Chat | Legacy catch-all key from before Ask/Agent/Plan were split |

---

## Deduplication — how multiple uploads are merged

GitHub Copilot Enterprise exports use 28-day rolling windows. Uploading two overlapping exports creates duplicate `user_login + day` records. `mergeRecords()` handles this by taking `Math.max` across all numeric fields for any duplicate key. The logic is safe because the same `(user, day)` pair always comes from the same source data — max is identical to taking either value.

Nested arrays (`totals_by_ide`, etc.) keep the first-seen copy.

---

## Aggregation model

Data passes through two stages. Understanding which stage produces which number matters when you're comparing charts to the table.

### Stage 1 — `aggregateData()` — runs on every filter change

Produces the `AggregatedData` object used by all charts and KPI cards.

```
filteredData (CopilotRecord[])
  └─ byUser     { [login]: { generations, acceptances, linesAdded, linesDeleted, activeTime, days: Set, features: Set } }
  └─ byDay      { [YYYY-MM-DD]: { generations, acceptances, linesAdded, linesDeleted, chatCount, activeUsers } }
  └─ byIDE      { [ide]: { generations, acceptances } }
  └─ byLanguage { [lang]: { generations, acceptances } }  ← sourced from totals_by_language_feature
  └─ byFeature  { [feature]: { generations, acceptances } }
  └─ byModel    { [model]: generations }  ← sourced from totals_by_language_model
```

**Nothing in Stage 1 is currency-aware.** Value calculations are not in `aggregatedData`.

### Stage 2 — DataTable component `useMemo` — runs independently

The Data Explorer re-aggregates `filteredData` (not `aggregatedData`) to:
- Track `days` as a `Set` for the Days Active column (correct distinct-day count)
- Compute value columns on the fly using the current `valueConfig` settings

This is intentional — `aggregatedData.byUser` doesn't carry value config and cannot produce dollar figures.

### What is aggregated vs raw

| View | Source | Granularity |
|------|--------|-------------|
| KPI cards | `aggregateData()` → `byUser` / `byDay` | Period totals |
| All 14 charts | `aggregateData()` → relevant slice | Period totals |
| Insights panel | `aggregateData()` + `filteredRecords` | Period totals + per-day checks |
| Data Explorer table | Component-level `useMemo` | Per user, selected period |
| Header "Export CSV" | `buildRawRecordsCSV` — no aggregation | Per user per day (raw) |
| Table "CSV" button | `buildDataCSV` — aggregated | Per user, selected period |
| "Export NDJSON" | `buildNDJSON(rawData)` — all data, no filter | Raw records, unfiltered |

---

## Charts (14 total)

All charts read from `aggregatedData` and rebuild whenever the filters change. Each has a CSV download button and a PNG export button.

### Activity Timeline
**Type:** multi-line (dual y-axis) | **Source:** `byDay`

Four series plotted over time: Generations (left axis), Chat interactions (left axis), Lines Added (right axis), Lines Deleted (right axis). The dual axis matters — generations and lines are different orders of magnitude and shouldn't share a scale.

### Lines of Code Trend
**Type:** area line | **Source:** `byDay`

Lines Added and Lines Deleted plotted as filled areas over time. Shows the rhythm of Copilot-assisted writing and deletion across the team.

### Acceptance Rate Trend
**Type:** line | **Source:** `byDay`

Daily acceptance rate (`acceptances / generations × 100`) plus a 7-day moving average. Null points are skipped (`spanGaps: true`) — days with no completions (e.g. pure agent-mode days) don't pull the average down to zero. Only meaningful when Code Completion is a significant share of usage.

### Daily Active Users
**Type:** area line | **Source:** `byDay`

Unique users with any Copilot activity each day. A flat line suggests consistent adoption; a declining line warrants attention.

### Top Users by Generations
**Type:** horizontal bar | **Source:** `byUser`, top 15

Users ranked by total trigger count. Bar color encodes acceptance rate: green ≥ 70%, indigo 20–70%, amber < 20%. High trigger count with amber color means the user reaches for Copilot often but accepts rarely — could indicate agent-mode-heavy usage (which doesn't track acceptances) or frequent dismissals.

### Top Users by Lines Added
**Type:** horizontal bar | **Source:** `byUser`, top 15

Users ranked by `loc_added_sum`. This is the clearest signal of Copilot producing real code output — the lines that actually landed in files.

### User Efficiency Matrix
**Type:** scatter | **Source:** `byUser`

X axis = total generations, Y axis = acceptance rate %. Only users with ≥ 50 generations appear (configured via `MIN_GENERATIONS_FOR_RATE`) — below that threshold the rate is not statistically meaningful. Top-right quadrant = high volume, high quality; bottom-right = high volume, low acceptance (likely agent-heavy users).

### User Engagement Distribution
**Type:** bar | **Source:** `byUser`

Users bucketed by number of active days: 1 day, 2–5, 6–10, 11–20, 21+. Shows whether adoption is shallow (many 1-day users) or deep (large 21+ bucket).

### IDE Market Share
**Type:** doughnut | **Source:** `byIDE`

Share of total generations by IDE. Sourced from `totals_by_ide` in each record.

### Language Distribution
**Type:** doughnut | **Source:** `byLanguage`

Top 10 languages by generation count, with all remaining languages collapsed into "Other". Sourced from `totals_by_language_feature`.

### Feature Usage
**Type:** bar | **Source:** `byFeature`

Total generations broken down by Copilot feature (Code Completion, Chat · Agent, Edit Mode, etc.). The feature key breakdown reveals whether your team is using inline completions, agentic workflows, or a mix.

### Acceptance Rate by IDE
**Type:** horizontal bar | **Source:** `byIDE`

Acceptance rate per IDE, sorted descending. Only IDEs with ≥ 50 total generations are included. Acceptance rate is only meaningful for completion-heavy workflows — if users in a given IDE lean toward agent mode, the rate will look low for unrelated reasons.

### Acceptance Rate by Language
**Type:** horizontal bar | **Source:** `byLanguage`

Acceptance rate per language, top 15, sorted descending. Same ≥ 50 generation minimum. Languages where Copilot completes code confidently (e.g. TypeScript, Python with type hints) tend to show higher rates.

### Model Distribution
**Type:** pie | **Source:** `byModel`

Total generations by AI model. Sourced from `totals_by_language_model`. Useful for tracking which model versions are being invoked across the team — especially relevant when multiple models are available in Enterprise.

---

## Data Explorer table

The Data Explorer shows one row per user, aggregated across the selected filter period.

### Columns

| Column | Source field | What it means |
|--------|-------------|---------------|
| User | `user_login` | GitHub username |
| Days Active | `days.size` (Set) | Distinct calendar days the user had any Copilot activity |
| Generations | `code_generation_activity_count` sum | Total Copilot triggers — how often they reached for AI |
| Lines Added | `loc_added_sum` sum | Lines that Copilot wrote and the user kept |
| Lines Deleted | `loc_deleted_sum` sum | Lines removed via Copilot (refactors, rewrites) |
| Net Lines | `linesAdded − linesDeleted` | Net change in codebase size from Copilot activity |
| Value Added | `linesAdded ÷ linesPerHour × rate` | Dollar estimate for lines added |
| Value Deleted | `linesDeleted ÷ linesPerHour × rate` | Dollar estimate for lines deleted (see note below) |
| Total Value | `(linesAdded + linesDeleted) ÷ linesPerHour × rate` | Combined value estimate — always ≥ 0 |

**Why generations and Lines Added diverge:** Generations count every trigger (including dismissed suggestions and all agent-mode actions). Lines Added only count code that actually landed in a file. A user with high generations and low lines added is likely using Chat or Agent mode heavily — those features write code through a different path than inline completions, and some agent outputs are exploratory rather than committed directly.

**Default sort:** Net Lines descending.

### Value Deleted means dollars saved, not dollars lost

When Copilot helps a developer delete code — removing dead branches, collapsing duplicated logic, rewriting a bloated function — that still represents developer time saved. The deletion was Copilot-assisted. Value Deleted uses the same rate formula as Value Added, so both contribute positively to Total Value. Net Lines can be negative (more deleted than added) while Total Value remains high — this is healthy: it means Copilot is doing substantive cleanup work.

---

## Value calculation

Value figures appear in the KPI cards ("Estimated Value") and all three value columns in the Data Explorer.

### Formula

```
hours = lines ÷ MANUAL_LINES_PER_HOUR
dollars = hours × BLENDED_RATE_PER_HOUR
```

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `MANUAL_LINES_PER_HOUR` | 30 | Lines a developer would write manually in an hour, without AI assistance |
| `BLENDED_RATE_PER_HOUR` | $90 | Blended hourly cost (salary + benefits + overhead) |

Both parameters are adjustable at runtime via the **Value Calculation Configuration** panel on the dashboard. Changes persist in `localStorage`.

### What this is and isn't

This is a **rough proxy for developer time saved**, not an ROI measurement. It assumes:
- Every Copilot-generated line would have required the same manual effort
- Lines of code is a reasonable unit of effort (it isn't always)
- Your team's actual rate approximates the configured blended rate

Use the numbers as a directional signal for conversations about adoption and impact — not as precise finance figures. Adjust the parameters to match your team's context.

---

## Insights panel

The Insights panel generates up to 6 cards automatically from the current filtered data. Cards appear only when there's something worth surfacing.

### Power Users
**Type:** success (green) | **Threshold:** top 10% by generation count (`POWER_USER_PERCENTILE = 0.90`)

Top users by Copilot trigger volume. This measures how often they reach for AI — not whether it produced value. High generation count can mean deep daily adoption or frequent triggering followed by dismissal. Paired with the Efficiency Matrix chart to understand whether high usage also means high acceptance.

**Shows:** up to 5 users with their generation totals.

### High Efficiency Users
**Type:** success (green) | **Threshold:** ≥ 70% acceptance rate AND ≥ 50 total generations (`HIGH_ACCEPTANCE_THRESHOLD = 0.70`, `MIN_GENERATIONS_FOR_RATE = 50`)

Users where Code Completion is working well — Copilot's suggestions are landing and being kept. The ≥ 50 generation minimum filters out users whose rate looks perfect because they only triggered Copilot twice. Agent mode and Chat don't track acceptances, so users who rely heavily on those features will not appear here regardless of their actual usage quality.

**Shows:** up to 5 users with their acceptance rates.

### Spotlight Users
**Type:** success (green) | **Threshold:** top 5 by `loc_added_sum`

Users where Copilot is visibly producing real output — the most lines written and kept. This is the strongest concrete signal of AI-assisted productivity: not just triggers, not just chat conversations, but actual lines of code that made it into files.

**Shows:** up to 5 users with their lines-added totals.

### Daily Quota Exceeded
**Type:** error (red) | **Threshold:** `code_generation_activity_count > 500` on a single day (`DAILY_GENERATION_QUOTA = 500`)

Individual days where a single user exceeded the configured daily generation limit. Useful for identifying unusual spikes — automated scripts using the Copilot API, testing sessions, or unusually intense days. The threshold is configurable in `app/domain/config/constants.js`.

**Shows:** up to 5 incidents as `user on date (count)`.

### Week-over-Week Trend
**Type:** success / info / warning | **Requires:** ≥ 14 days of data (`TREND_COMPARISON_DAYS = 7`)

Compares total generations in the most recent 7 days against the prior 7 days. Positive change = success (green), > −10% = info (neutral), ≤ −10% = warning (amber). Requires at least 14 days of data in the selected date range to appear.

**Shows:** percentage change with direction.

### Zero Acceptance Days
**Type:** warning (amber)

Count of user-day records where Copilot was triggered (`code_generation_activity_count > 0`) but nothing was accepted. This is **expected behaviour in agent mode** — when Copilot writes code autonomously via agent/edit workflows, there are no "acceptance" events. This card is a flag, not necessarily a concern. High counts in an org that has moved to agent-first workflows are normal.

**Shows:** count of affected user-day records.

---

## Exports

| Export | Triggered by | Format | Content |
|--------|-------------|--------|---------|
| Header "Export CSV" | Top-right export menu | CSV | Per-user per-day raw records (one row per record), with all filter applied, no aggregation |
| Header "Export NDJSON" | Top-right export menu | NDJSON | All raw data, **no filter applied** — full dataset as uploaded |
| Table "CSV" | Button inside Data Explorer | CSV | Aggregated per-user view matching the table (9 columns) |
| Chart "CSV" | Download button on each chart card | CSV | Data slice for that specific chart |
| Chart "PNG" | Camera button on each chart card | PNG | Screenshot of the rendered chart |
