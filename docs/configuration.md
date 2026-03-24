# Configuration

All thresholds live in `app/domain/config/constants.js`. Change values there, not inside the algorithms.

## CONFIG object

```javascript
export const CONFIG = {
  // ── Business thresholds ──────────────────────────────────────────────────
  DAILY_GENERATION_QUOTA:    500,   // Generations/user/day above this = Quota Exceeded insight
  LOW_ACCEPTANCE_THRESHOLD:  0.20,  // Reserved (not used — see note below)
  HIGH_ACCEPTANCE_THRESHOLD: 0.70,  // Acceptance rate above this = High Efficiency insight

  // ── User classification ──────────────────────────────────────────────────
  POWER_USER_PERCENTILE:     0.90,  // Top 10% by generations = Power User
  MIN_GENERATIONS_FOR_RATE:  50,    // Min generations required before acceptance rate is meaningful

  // ── Trend analysis ───────────────────────────────────────────────────────
  TREND_COMPARISON_DAYS:     7,     // Week-over-week window size

  // ── UI limits ────────────────────────────────────────────────────────────
  TABLE_PAGE_SIZE:           100,
  CHART_ANIMATION_DURATION:  750,   // ms
  MAX_TOP_USERS_SHOWN:       15,
  MAX_LANGUAGES_SHOWN:       10,

  // ── Parser performance ───────────────────────────────────────────────────
  CHUNK_SIZE:                10000, // Lines processed per setTimeout(0) batch
  MAX_FILE_SIZE_MB:          100,

  // ── Value calculation defaults (user-overridable in the UI) ─────────────
  BLENDED_RATE_PER_HOUR:     90,    // $/hr average developer cost
  MANUAL_LINES_PER_HOUR:     30,    // Lines a developer writes manually per hour
};
```

## Runtime value overrides

`BLENDED_RATE_PER_HOUR` and `MANUAL_LINES_PER_HOUR` can be changed in the dashboard's configuration panel. Values are saved to `localStorage` and loaded on next visit. The domain functions that compute value estimates receive a `ValueConfig` object as an argument rather than reading `CONFIG` directly — this keeps them testable with any values.

## Why LOW_ACCEPTANCE_THRESHOLD isn't used

The Low Acceptance Rate alert was intentionally removed. Around 94% of Copilot activity is agent mode (Chat · Agent, Edit Mode, general Agent), which does not track acceptance events. A user with 2,000 agent interactions and 0 acceptances looks identical to a user who never accepts anything — making the metric useless as a signal. The threshold constant is retained in case a future product change makes it meaningful again.

## Feature Labels

`FEATURE_LABELS` in the same file maps raw Copilot API feature keys to human-readable metadata. When a new feature key appears in export data that isn't in the map, `humanizeFeature()` in `common/utils/format.js` falls back to a capitalised, underscore-stripped version.

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
