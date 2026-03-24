# CLAUDE.md

Project instructions for Claude Code. See also `AGENTS.md` for agent-specific guidance and skill recommendations.

---

## What this project is

**GitHub Copilot Enterprise Dashboard** — browser-based analytics for GitHub Copilot Enterprise usage data. Zero backend. Everything runs client-side. Deployed to GitHub Pages via Vite.

**Repository:** [github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard)

---

## Architecture

This codebase follows Clean Architecture with SOLID principles. Read `docs/architecture.md` for diagrams.

**Three layers:**

1. **`app/domain/`** — pure JavaScript. No DOM, no globals. Receives data as arguments, returns data. Fully testable in Node.
2. **`app/state/store.js`** — single mutable state object. Domain functions never import it directly.
3. **`app/presentation/`** — DOM-aware components and chart renderers. Thin shell over the domain.

**Rule:** nothing in `app/domain/` may import from `app/presentation/` or `app/state/`. If you find yourself wanting to, the logic belongs somewhere else.

### Domain modules

| Module | Job |
|--------|-----|
| `app/domain/config/constants.js` | CONFIG thresholds + FEATURE_LABELS |
| `app/domain/data/parser.js` | `parseNDJSON(text, opts)` → `CopilotRecord[]` |
| `app/domain/data/merger.js` | `mergeRecords(records[])` — dedup overlapping exports with Math.max |
| `app/domain/data/aggregator.js` | `aggregateData(records[])` → byUser/Day/IDE/Language/Feature/Model |
| `app/domain/filtering/engine.js` | `filterRecords(records[], criteria)` + dropdown option extraction |
| `app/domain/insights/engine.js` | `generateInsights(aggregated, records, config)` → `Insight[]` |
| `app/domain/export/csv.js` | CSV builders for all data views |
| `app/domain/export/ndjson.js` | `buildNDJSON(records[])` for consolidated export |
| `common/utils/format.js` | `formatNumber`, `humanizeFeature` |
| `common/utils/download.js` | `triggerDownload` (browser-side, not a domain module) |
| `common/types/index.js` | JSDoc type definitions for the whole domain |

### NDJSON schema

```json
{
  "user_login": "string",
  "day": "YYYY-MM-DD",
  "code_generation_activity_count": number,
  "code_acceptance_activity_count": number,
  "loc_added_sum": number,
  "loc_deleted_sum": number,
  "active_time_minutes": number,
  "totals_by_ide": [{"ide": "vscode", "code_generation_activity_count": N}],
  "totals_by_feature": [{"feature": "code_completion", "code_generation_activity_count": N}],
  "totals_by_language_feature": [{"language": "python", "feature": "...", "code_generation_activity_count": N}],
  "totals_by_language_model": [{"model": "gpt-4", "code_generation_activity_count": N}],
  "model": "string"
}
```

### Merge strategy

GitHub Copilot Enterprise exports use 28-day rolling windows. Uploading two exports with overlapping date ranges creates duplicate `user_login + day` records. `mergeRecords()` deduplicates by taking `Math.max` for all numeric fields (same day = same data, so max is safe) and keeping the first-seen nested arrays.

---

## Quick reference

### Running the project

```bash
make install    # npm install + playwright browsers
make dev        # vite dev server — http://localhost:3000
make test       # 93 unit tests (vitest)
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
- **Add chart** → `app/presentation/charts/` + `index.html` canvas + CSV builder in `app/domain/export/csv.js`
- **Add KPI card** → `app/presentation/components/kpi.js`
- **Add filter** → `app/domain/filtering/engine.js` + `filterRecords()` + test
- **Change threshold** → `app/domain/config/constants.js` only
- **Full guides** → `docs/`

---

## Tests

93 unit tests in `tests/unit/`, all passing. Every domain function has tests. When changing a domain module, update its tests too — the test file lives at the same relative path under `tests/unit/`.

E2E tests in `tests/e2e/dashboard.spec.js` cover the upload → dashboard → filter → export flow.

---

## Deployment

Push to `main` → GitHub Actions runs `npm ci && npm run build` → deploys `dist/` to GitHub Pages. The `vite.config.js` reads `GITHUB_REPOSITORY` to set the correct base path for the Pages subdirectory.

See `docs/deployment.md` for the full pipeline diagram.

---

## Agent guidance

See `AGENTS.md` for:
- Which modules are safe to edit (domain = always safe; presentation = carefully)
- Recommended Claude Code skills for common tasks (`/tdd`, `/ship`, `/wrap-up`, etc.)
- SOLID constraints that agents must follow
- Entry points for specific tasks (parsing, merging, insights, exports)

---

## Privacy

100% client-side. No data leaves the browser. No backend. Safe for enterprise usage data.
