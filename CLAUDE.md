# CLAUDE.md

Project instructions for Claude Code. See also `AGENTS.md` for agent-specific guidance and skill recommendations.

---

## What this project is

**GitHub Copilot Enterprise Dashboard** — React + Vite browser-based analytics for GitHub Copilot Enterprise usage data. Zero backend. Everything runs client-side. Deployed to GitHub Pages.

**Repository:** [github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard)

---

## Architecture

This codebase follows Clean Architecture with SOLID principles. Read `docs/architecture.md` for full diagrams.

**Three layers:**

1. **`app/domain/`** — pure JavaScript. No DOM, no globals. Receives data as arguments, returns data. Fully testable in Node.
2. **`app/state/useAppState.js`** — React hook that orchestrates all domain calls. Components consume it via `useApp()` from `AppContext`.
3. **`app/presentation/`** — React JSX components and Chart.js renderers. Thin shell over the domain.

**Rule:** nothing in `app/domain/` may import from `app/presentation/` or `app/state/`. If you find yourself wanting to, the logic belongs somewhere else.

### Domain modules

| Module | Job |
|--------|-----|
| `app/domain/config/constants.js` | CONFIG thresholds + FEATURE_LABELS |
| `app/domain/data/parser.js` | `parseNDJSON(text, opts)` → `CopilotRecord[]` |
| `app/domain/data/merger.js` | `mergeRecords(records[])` — dedup overlapping exports with Math.max |
| `app/domain/data/aggregator.js` | `aggregateData(records[])` → byUser/Day/IDE/Language/Feature/Model |
| `app/domain/data/detect.js` | `detectFileType(name, text)` → `'activity'｜'aiusage'` — routes uploads |
| `app/domain/filtering/engine.js` | `filterRecords(records[], criteria)` + dropdown option extraction |
| `app/domain/insights/engine.js` | `generateInsights(aggregated, records, config)` → `Insight[]` |
| `app/domain/export/csv.js` | CSV builders for all data views |
| `app/domain/export/ndjson.js` | `buildNDJSON(records[])` for consolidated export |
| `app/domain/aiusage/parser.js` | `parseAIUsageCSV(text, opts)` → `AIUsageRecord[]` (RFC-4180 CSV reader, BOM-aware) |
| `app/domain/aiusage/aggregator.js` | `aggregateAIUsage(records[])` → totals + byUser/Day/Model/Org/CostCenter/Sku |
| `app/domain/aiusage/filtering.js` | `filterAIUsage(records[], criteria)` + option extraction |
| `app/domain/aiusage/insights.js` | `generateAIUsageInsights(aggregated, records, config)` → `Insight[]` |
| `app/domain/aiusage/budget.js` | `computeAIUsageBudget(records)` (run-rate projection per user/org/enterprise) + `generateBudgetInsights()` |
| `app/domain/aiusage/export.js` | CSV builders for the AI Usage views |
| `common/utils/format.js` | `formatNumber`, `formatCurrency`, `formatCredits`, `humanizeFeature` |
| `common/utils/download.js` | `triggerDownload` (browser-side, not a domain module) |
| `common/types/index.js` | JSDoc type definitions for the whole domain |

### NDJSON schema (real API format, late 2025)

```json
{
  "user_login": "string",
  "day": "YYYY-MM-DD",
  "code_generation_activity_count": number,
  "code_acceptance_activity_count": number,
  "user_initiated_interaction_count": number,
  "loc_suggested_to_add_sum": number,
  "loc_suggested_to_delete_sum": number,
  "loc_added_sum": number,
  "loc_deleted_sum": number,
  "used_agent": boolean,
  "used_chat": boolean,
  "totals_by_ide": [{"ide": "vscode", "code_generation_activity_count": N, ...}],
  "totals_by_feature": [{"feature": "chat_panel_agent_mode", "code_generation_activity_count": N, ...}],
  "totals_by_language_feature": [{"language": "python", "feature": "...", "code_generation_activity_count": N}],
  "totals_by_language_model": [{"language": "python", "model": "claude-4.5-sonnet", "code_generation_activity_count": N}],
  "totals_by_model_feature": [{"model": "claude-4.5-sonnet", "feature": "...", "code_generation_activity_count": N}]
}
```

**Key schema notes:**
- `loc_added_sum` = lines actually accepted/applied (not ghost text shown)
- `loc_suggested_to_add_sum` = lines Copilot showed as suggestions
- `active_time_minutes` is **absent** from current exports — parser defaults it to 0
- Root-level `model` field is **absent** — model data is in `totals_by_language_model`

### AI Usage Report (second dataset — credits/cost)

GitHub also exports an **AI Usage Report CSV** (`AIUsageReport_*.csv`) — AI-credit consumption /
billing, a *different* dataset from the activity NDJSON. The app auto-detects file type on upload
(`detect.js`) and keeps the two datasets fully independent; when both are loaded, an **Activity / AI
Usage** tab switcher appears (`ViewTabs.jsx`, driven by `activeView` in `useAppState`).

CSV columns (BOM-prefixed, header-driven so order-independent):
`date, username, product, sku, model, quantity, unit_type, applied_cost_per_quantity, gross_amount,
discount_amount, net_amount, total_monthly_quota, organization, repository, cost_center_name,
aic_quantity, aic_gross_amount`.

Key notes:
- `quantity`/`aic_quantity` = **AI credits** consumed (fractional); `gross_amount` = $ value;
  `net_amount` is often **$0** (fully discounted while under the monthly quota) — gross is the
  headline spend metric, net shown alongside.
- `model` may be prefixed `Auto: ` (auto-routed). The parser sets `isAuto` and `baseModel` (prefix
  stripped); the aggregator merges Auto/explicit variants under `baseModel` and tracks the split.
- `sku`: `copilot_ai_credit` (chat/completions) vs `coding_agent_ai_credit` (coding agent).
- AI Usage presentation lives in `app/presentation/components/aiusage/` and
  `app/presentation/charts/aiusage/`. Thresholds (`NEAR_QUOTA_THRESHOLD`, `TOP_SPENDERS_SHOWN`) live
  in `constants.js`.

**Budget & burn rate.** `budget.js` projects month-end consumption from the observed run rate
(`projected = consumed + dailyRate × remainingDays`) at the **individual, org, and enterprise** level,
comparing against the per-user `total_monthly_quota`. Credits are priced at **`CREDIT_USD` = $0.01**
(model multipliers are already baked into the credit counts) — see `PRICING_DOCS_URL` in `constants.js`
([GitHub models & pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)).
The dashboard surfaces an enterprise burn-down chart (cumulative vs projection vs budget ceiling), org
utilization, projected per-user quota overage, and Used-vs-Allotted breakdown tables (credits **and**
dollars). Budget insights are prepended to `aiUsageInsights` in `useAppState`.

Guardrails (so the budget view stays honest):
- **Confidence gating** — below `MIN_PROJECTION_DAYS` (7) observed days, `enterprise.confidence` is
  `'low'`: the status pill shows `PRELIMINARY`, the red alarm is suppressed, and budget insights are
  downgraded to `info`.
- **Consumption vs billed** — gross (credits × $0.01) is labeled **Consumption Value**; `net_amount`
  is surfaced as **Billed to Date**.
- **Overage is per-seat, not pooled.** Quota is enforced per user, so the real billable overage is
  `enterprise.billableProjectedOverage` = Σ over users of `max(0, projected_user − quota_user)` — NOT
  `enterprise_projected − enterprise_allowance`. A heavy user is billed even when the org has idle-seat
  headroom, so this can be non-zero while total consumption sits under the summed allowance. The status
  pill (`OVERAGE PROJECTED`) and the Projected Overage card both use this per-seat figure.
- **Multi-month** — `enterprise.multiMonth` flags files spanning >1 calendar month (the monthly
  projection assumes one month); a warning banner + insight tell the user to filter to a single month.
- **License config is dataset-specific** — held in memory only (never localStorage) and cleared on
  reset or any fresh (non-append) load, so seats never bleed across enterprises.
- Derived data in `useAppState` (both activity and AI-usage pipelines) is `useMemo`-ized.
- `detectFileType` requires a multi-column AI-usage signature so unrelated CSVs aren't misrouted.

### Merge strategy

GitHub Copilot Enterprise exports use 28-day rolling windows. Uploading two exports with overlapping date ranges creates duplicate `user_login + day` records. `mergeRecords()` deduplicates by taking `Math.max` for all numeric fields (same day = same data, so max is safe) and keeping the first-seen nested arrays.

---

## Quick reference

### Running the project

```bash
make install    # npm install + playwright browsers
make dev        # vite dev server — http://localhost:3000
make test       # unit tests (vitest)
make test-e2e   # playwright e2e
make build      # production build → dist/
```

### Key config values (`app/domain/config/constants.js`)

| Constant | Default | Meaning |
|----------|---------|---------|
| `DAILY_GENERATION_QUOTA` | 500 | Quota Exceeded insight threshold |
| `HIGH_ACCEPTANCE_THRESHOLD` | 0.70 | High Efficiency insight threshold |
| `POWER_USER_PERCENTILE` | 0.90 | Top 10% by generations |
| `MIN_GENERATIONS_FOR_RATE` | 50 | Min gens before acceptance rate is meaningful |
| `CHUNK_SIZE` | 10000 | NDJSON lines per setTimeout(0) batch |

### Common tasks

- **Add insight** → `app/domain/insights/engine.js` + `tests/unit/domain/insights/engine.test.js`
- **Add chart** → new `app/presentation/charts/MyChart.jsx` + register in `Dashboard.jsx` + CSV builder in `app/domain/export/csv.js`
- **Add KPI card** → `app/presentation/components/kpi/KpiSection.jsx`
- **Add filter** → `app/domain/filtering/engine.js` + `filterRecords()` + `FilterBar.jsx` + test
- **Change threshold** → `app/domain/config/constants.js` only
- **Full guides** → `docs/`

---

## Tests

Unit tests in `tests/unit/`, all passing. Every domain function has tests. When changing a domain module, update its tests — the test file is at the same relative path under `tests/unit/`.

E2E tests in `tests/e2e/dashboard.spec.js` cover the upload → dashboard → filter → export flow.

---

## Deployment

Push to `main` → GitHub Actions runs `npm ci && npm run build` → deploys `dist/` to GitHub Pages. The `vite.config.js` reads `GITHUB_REPOSITORY` to set the correct base path.

See `docs/deployment.md` for the full pipeline diagram.

---

## Agent guidance

See `AGENTS.md` for:
- Which modules are safe to edit (domain = always safe; presentation = carefully)
- Recommended Claude Code skills for common tasks (`/tdd`, `/ship`, `/wrap-up`, etc.)
- SOLID constraints agents must follow
- Entry points for specific tasks (parsing, merging, insights, exports)

---

## Privacy

100% client-side. No data leaves the browser. No backend. Safe for enterprise usage data.
