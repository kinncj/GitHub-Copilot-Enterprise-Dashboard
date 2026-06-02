# GitHub Copilot Enterprise Dashboard

Browser-based analytics for GitHub Copilot Enterprise usage and AI-credit cost data.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-live-success.svg)](https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/)
[![Tests](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard/actions/workflows/ci.yml)

**Live:** [kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard](https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/)

---

## What it does

The dashboard reads GitHub's **two** Copilot exports. Drop either (or both); the file type is detected on upload, and when both are loaded a tab switches between them. They are analysed separately.

### Activity report (NDJSON)

Team usage and productivity from the Copilot Enterprise API export.

- **14 charts** — activity timelines, acceptance rate trends, user rankings, IDE/language/feature/model breakdowns
- **KPI cards** — total users, generations, acceptance rate, lines of code, estimated value
- **Feature adoption** — which Copilot features (Code Completion, Edit Mode, Chat · Agent, etc.) the team uses
- **Insights** — power users, high-efficiency users, spotlight users (top code producers), weekly trend, quota alerts
- **Data table** — per-user aggregated view, sortable and filterable
- **Exports** — CSV and PNG per chart, consolidated NDJSON

### AI Usage report (CSV)

AI-credit consumption and cost from the billing export.

- **Cost & credits** — credits over time, top users, by model (auto-routed vs explicit), by org/cost-center/SKU
- **Budget & burn rate** — month-end projection at the user, org, and enterprise level, against each seat's monthly quota
- **License config** — enter real licenses per tier so org/enterprise budgets count idle seats the export leaves out
- **Per-seat overage** — credits don't pool, so projected overage is the sum of each user's own excess (the real billable risk)
- Credits priced at $0.01 each (GitHub's rate); projections under 7 days of data are marked preliminary

**Nothing leaves the browser.** No backend, no API calls, no tracking. Safe for enterprise usage and billing data.

---

## Quick start

```bash
npm install
npm run dev     # http://localhost:3000
```

Drop a Copilot Enterprise **NDJSON** export or an **AI Usage Report CSV** onto the upload zone — the type is detected automatically. Multiple NDJSON files merge into one date range (handy for overlapping 28-day rolling exports); load a CSV alongside them to get the cost and budget views.

---

## Stack

| Layer | Tool |
|-------|------|
| UI | React 18 + JSX |
| Build | Vite 5 |
| Charts | Chart.js 4 |
| Styles | Tailwind CSS 3 |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Deploy | GitHub Pages via GitHub Actions |

---

## Architecture

Clean Architecture with SOLID principles. Three layers:

1. **`app/domain/`** — pure JS, no DOM. Two parallel pipelines: the activity one (`data/`, `filtering/`, `insights/`, `export/`) and the AI-usage one (`aiusage/` — parser, aggregator, filtering, insights, budget, export), plus `data/detect.js` to route uploads.
2. **`app/state/useAppState.js`** — React hook that orchestrates both pipelines and holds the active view.
3. **`app/presentation/`** — React components and Chart.js renderers (`components/aiusage/` and `charts/aiusage/` for the cost dashboard).

Domain modules have no imports from the presentation or state layer — fully testable in Node without a browser.

See [`docs/architecture.md`](docs/architecture.md) for diagrams.

---

## Docs

| Doc | What's in it |
|-----|-------------|
| [`docs/data.md`](docs/data.md) | Every data point, all 14 charts, Data Explorer columns, insights, value calculation, the AI Usage report + budget/burn-rate model |
| [`docs/architecture.md`](docs/architecture.md) | Layer diagrams, data flow, NDJSON schema, SOLID table |
| [`docs/development.md`](docs/development.md) | How to add charts, insights, KPIs, filters, exports |
| [`docs/configuration.md`](docs/configuration.md) | CONFIG thresholds, FEATURE_LABELS, value calculation |
| [`docs/testing.md`](docs/testing.md) | Unit + E2E test layout, how to write tests |
| [`docs/deployment.md`](docs/deployment.md) | GitHub Pages pipeline, base path setup |
| [`AGENTS.md`](AGENTS.md) | Agent/Claude Code guidance, SOLID constraints, entry points |

---

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).

Copyright © 2026 Kinn Coelho Juliao
