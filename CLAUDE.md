# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GitHub Copilot Enterprise Dashboard** - A production-ready, zero-dependency analytics dashboard for visualizing GitHub Copilot Enterprise usage data.

**Repository:** [github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard)

**Key Files:**
- `index.html` - Main analytics dashboard (production-ready, single-file architecture)
- `docs/` - Comprehensive documentation with Mermaid diagrams
- Sample data files for testing (check repository for examples)

**Documentation:**
- Full documentation available in `docs/` folder
- Start with `docs/README.md` for navigation
- Architecture diagrams in `docs/architecture.md`

## Architecture

### Single-File Architecture

Both dashboards follow a **zero-dependency, single-file HTML architecture**:
- All dependencies loaded via CDN (Tailwind CSS, Chart.js, Lucide Icons)
- No build process, package managers, or Node.js required
- Self-contained: HTML structure + embedded CSS + embedded JavaScript
- Can be opened directly in any modern browser

### Data Flow

See `docs/architecture.md` for detailed Mermaid diagrams. Quick overview:
- User uploads NDJSON → Chunked Parser (10k lines/batch)
- Data Validation & Normalization
- Aggregation Engine (by user, day, IDE, language, feature, model)
- Filter Engine → Parallel Rendering (KPIs + Charts + Insights + Table)

### NDJSON Schema

GitHub Copilot Enterprise exports have this per-record structure:
```json
{
  "user_login": "string",
  "day": "YYYY-MM-DD",
  "code_generation_activity_count": number,
  "code_acceptance_activity_count": number,
  "loc_added_sum": number,
  "loc_deleted_sum": number,
  "active_time_minutes": number,
  "totals_by_ide": [{"ide": "vscode", "generations": N, ...}],
  "totals_by_feature": [{"feature": "code_completion", "count": N, ...}],
  "totals_by_language_feature": [{"language": "python", "feature": "...", ...}],
  "totals_by_model_feature": [{"model": "claude-4.5-sonnet", ...}],
  "model": "string"
}
```

## Key Components (copilot-analytics-dashboard.html)

### State Management
Single global `state` object tracks:
- `rawData` - Original parsed records
- `filteredData` - After filters applied
- `aggregatedData` - Pre-computed rollups (byUser, byDay, byIDE, etc.)
- `charts` - Chart.js instances for cleanup/redraw
- `filters` - Current filter values
- `sortColumn/sortDirection` - Table sorting state

### Customization Config
All business thresholds in `CONFIG` object (lines ~550-575):
```javascript
const CONFIG = {
  DAILY_GENERATION_QUOTA: 500,           // Alert threshold
  LOW_ACCEPTANCE_THRESHOLD: 0.20,        // 20% warning
  HIGH_ACCEPTANCE_THRESHOLD: 0.70,       // 70% badge
  POWER_USER_PERCENTILE: 0.90,           // Top 10%
  MIN_GENERATIONS_FOR_RATE: 50,          // Min for rate calc
  CHART_ANIMATION_DURATION: 750,
  MAX_TOP_USERS_SHOWN: 15,
  MAX_LANGUAGES_SHOWN: 10,
  CHUNK_SIZE: 10000,                     // Parser chunk size
  // ...
};
```

### Performance Strategy
- **Chunked parsing**: Process 10k lines at a time with `setTimeout(0)` to prevent UI freezing on large files (100MB+)
- **Single-pass aggregation**: Data aggregated during filter application, not on-demand
- **Virtual scrolling simulation**: Table limited to first 500 rows for rendering performance
- **Chart reuse**: Chart.js instances destroyed and recreated on filter changes to prevent memory leaks

### Chart Architecture (9 Charts Total)
1. **Activity Timeline** - Multi-line (generations, acceptances, chat) over time
2. **Acceptance Rate Trend** - Area chart with 7-day moving average
3. **Top Users by Generations** - Horizontal bar, color-coded by acceptance rate
4. **Top Users by Acceptance** - Horizontal bar, filtered to min 50 generations
5. **IDE Market Share** - Doughnut chart
6. **Language Distribution** - Doughnut, top 10 + "Other"
7. **Feature Usage** - Bar chart
8. **User Efficiency Matrix** - Scatter plot (generations vs acceptance rate)
9. **Model Distribution** - Pie chart

All charts use consistent theming via `getChartOptions()` helper.

### Insights Engine
Automated detection system (lines ~1950-2050) identifies:
- **Power Users**: Top 10% by generations
- **High Efficiency**: Top users by acceptance rate (>70%, min 50 gens)
- **Low Acceptance Alerts**: Users <20% acceptance
- **Quota Exceeded**: Days with >500 generations/user
- **Week-over-Week Trends**: Activity change calculations
- **Zero Acceptance Days**: Generations without any acceptances

## Quick Reference for Development

For comprehensive guides, see the `docs/` folder:

- **Getting Started:** `docs/getting-started.md` - Quick start and basic usage
- **Architecture:** `docs/architecture.md` - System design with Mermaid diagrams
- **Configuration:** `docs/configuration.md` - All CONFIG options explained
- **Development:** `docs/development.md` - How to add features and extend functionality
- **API Reference:** `docs/api-reference.md` - Complete function documentation
- **Deployment:** `docs/deployment.md` - Hosting and deployment guides
- **Troubleshooting:** `docs/troubleshooting.md` - Common issues and solutions

### Quick Development Tips

**Testing:**
```bash
# Open in browser
open index.html

# Or use local server if needed
python3 -m http.server 8000
```

**Key Configuration (in CONFIG object, lines ~550-575):**
- `DAILY_GENERATION_QUOTA: 500` - Alert threshold
- `LOW_ACCEPTANCE_THRESHOLD: 0.20` - Warning threshold (20%)
- `HIGH_ACCEPTANCE_THRESHOLD: 0.70` - Excellence threshold (70%)
- `CHUNK_SIZE: 10000` - Parsing chunk size

**Common Tasks:**
- Add chart: See `docs/development.md#adding-a-new-chart`
- Add KPI: See `docs/development.md#adding-a-new-kpi-card`
- Add filter: See `docs/development.md#adding-a-new-filter`
- Add insight: See `docs/development.md#adding-a-new-insight`

**Browser Requirements:**
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- ES6+ JavaScript support required

**Privacy & Security:**
- 100% client-side processing
- No data leaves the browser
- No backend required
- Safe for sensitive enterprise data
