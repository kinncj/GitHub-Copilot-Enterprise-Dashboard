# GitHub Copilot Enterprise Dashboard

Browser-based analytics for GitHub Copilot Enterprise usage data.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-live-success.svg)](https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/)

**Live:** [kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard](https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/)

---

## What it does

Upload one or more NDJSON exports from the GitHub Copilot Enterprise API. The dashboard parses, deduplicates, and visualises:

- **14 charts** — activity timelines, acceptance rate trends, user rankings, IDE/language/feature/model breakdowns
- **KPI cards** — total users, generations, acceptance rate, lines of code, estimated value
- **Feature adoption** — which Copilot features (Code Completion, Edit Mode, Chat · Agent, etc.) are used across the team
- **Insights** — power users, high-efficiency users, weekly trend, quota alerts
- **Data table** — filterable, sortable per-user/day records
- **Exports** — CSV and PNG per chart, consolidated NDJSON

**Nothing leaves the browser.** No backend, no API calls, no tracking. Safe for enterprise usage data.

---

## Quick start

```bash
npm install
npm run dev     # http://localhost:3000
```

Drop an NDJSON export from the GitHub Copilot Enterprise API onto the upload zone. Multiple files are merged automatically — useful for combining overlapping 28-day rolling exports.

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

1. **`app/domain/`** — pure JS, no DOM. Parser, merger, aggregator, filter engine, insights engine, CSV/NDJSON exporters.
2. **`app/state/useAppState.js`** — React hook that orchestrates all domain calls.
3. **`app/presentation/`** — React components and Chart.js renderers.

Domain modules have no imports from the presentation or state layer — fully testable in Node without a browser.

See [`docs/architecture.md`](docs/architecture.md) for diagrams.

---

## Docs

| Doc | What's in it |
|-----|-------------|
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
