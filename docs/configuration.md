# Configuration

All thresholds live in `app/domain/config/constants.js`. Change values there, not inside the algorithms.

## CONFIG object

```javascript
export const CONFIG = {
  // ── Business thresholds ──────────────────────────────────────────────────
  DAILY_GENERATION_QUOTA:    500,   // generations/user/day above this = Quota Exceeded insight
  LOW_ACCEPTANCE_THRESHOLD:  0.20,  // reserved — not used (see note below)
  HIGH_ACCEPTANCE_THRESHOLD: 0.70,  // acceptance rate above this = High Efficiency insight

  // ── User classification ──────────────────────────────────────────────────
  POWER_USER_PERCENTILE:     0.90,  // top 10% by generations = Power User insight
  MIN_GENERATIONS_FOR_RATE:  50,    // min generations before acceptance rate is meaningful

  // ── Trend analysis ───────────────────────────────────────────────────────
  TREND_COMPARISON_DAYS:     7,     // week-over-week window size

  // ── UI limits ────────────────────────────────────────────────────────────
  TABLE_PAGE_SIZE:           100,
  CHART_ANIMATION_DURATION:  750,   // ms
  MAX_TOP_USERS_SHOWN:       15,
  MAX_LANGUAGES_SHOWN:       10,

  // ── Parser performance ───────────────────────────────────────────────────
  CHUNK_SIZE:                10000, // lines processed per setTimeout(0) batch
  MAX_FILE_SIZE_MB:          100,

  // ── Value calculation defaults (user-overridable in the UI) ─────────────
  BLENDED_RATE_PER_HOUR:     90,    // $/hr average developer cost
  MANUAL_LINES_PER_HOUR:     30,    // lines a developer writes manually per hour

  // ── AI Usage report (credit/cost) ───────────────────────────────────────
  NEAR_QUOTA_THRESHOLD:      0.80,  // flag users/orgs at >= 80% of their credit budget
  TOP_SPENDERS_SHOWN:        5,     // users listed in the Top Spenders insight
  MIN_PROJECTION_DAYS:       7,     // below this many observed days, projections are "preliminary"
  CREDIT_USD:                0.01,  // dollar value of one AI credit (GitHub's rate)
  PRICING_DOCS_URL: 'https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing',
};
```

## Runtime value overrides

`BLENDED_RATE_PER_HOUR` and `MANUAL_LINES_PER_HOUR` can be changed in the dashboard's "Value Calculation Configuration" panel. The domain functions that compute value estimates receive a `ValueConfig` object as an argument rather than reading `CONFIG` directly — keeping them testable with any values.

The AI Usage view has a second runtime panel, "License & Budget Configuration", where you enter licenses per tier (seats × per-seat quota) per org. `computeAIUsageBudget(records, licenseConfig)` takes that config as an argument; when it's enabled, org and enterprise budgets come from the configured seats instead of the active users in the file. This config is held in memory only (never localStorage) and is cleared on reset or a fresh upload, since seat counts are specific to one dataset.

### Notes on the AI Usage constants

- `CREDIT_USD` (0.01) converts credits to dollars. Model multipliers are already folded into the credit counts in the export, so `credits × CREDIT_USD` gives gross dollars. `PRICING_DOCS_URL` is linked from the budget panel as the source.
- `MIN_PROJECTION_DAYS` (7) gates the burn-rate projection: with fewer observed days, `enterprise.confidence` is `'low'`, the projection is labelled preliminary, and the over-budget alarm is suppressed.
- `NEAR_QUOTA_THRESHOLD` (0.80) drives the "at risk" status and the near-quota insights at both the per-user and per-org level.

## Why LOW_ACCEPTANCE_THRESHOLD isn't used

The Low Acceptance Rate alert was removed. Around 94% of Copilot activity in enterprise exports is agent mode (Chat · Agent, Edit Mode), which does not track acceptance events. A user with 2,000 agent interactions and 0 acceptances looks identical to a user who never accepts anything — making the metric useless as a signal. The constant is kept in case a future API change makes it meaningful again.

---

## Feature Labels

`FEATURE_LABELS` in the same file maps raw Copilot API feature keys to human-readable metadata used across the KPI cards and Feature Usage chart.

### Current known feature keys (as of late 2025)

| API key | Label | Description |
|---------|-------|-------------|
| `code_completion` | Code Completion | Passive inline ghost-text suggestions, accepted with Tab |
| `agent_edit` | Edit Mode | Copilot Edits panel — agentic multi-file editing with diff review |
| `chat_panel_agent_mode` | Chat · Agent | Autonomous agent via the Chat panel |
| `chat_panel_ask_mode` | Chat · Ask | Q&A mode in the Chat panel — explains but doesn't edit |
| `chat_panel_plan_mode` | Chat · Plan | Plan mode — Copilot drafts a step-by-step plan before acting |
| `chat_panel_custom_mode` | Chat · Custom | Custom-instructions mode with user-defined system prompts |
| `chat_panel_unknown_mode` | Chat · Other | Unrecognised mode flag — likely beta/preview |
| `agent` | Agent Mode | General agentic activity catch-all |
| `chat_inline` / `inline_chat` | Inline Chat | ⌘I / Ctrl+I inline editor chat |
| `chat` | Copilot Chat | Legacy catch-all key (pre-Ask/Agent split) |

When a key appears that isn't in `FEATURE_LABELS`, `humanizeFeature()` in `common/utils/format.js` falls back to a capitalised, underscore-stripped version of the key.

To add a new feature:

```javascript
// app/domain/config/constants.js
export const FEATURE_LABELS = {
  // ... existing entries ...
  my_new_feature: {
    label: 'My New Feature',
    short: 'New',
    icon: 'cpu',
    desc: 'What this feature does in plain language.'
  }
};
```
