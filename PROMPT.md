# GitHub Copilot Enterprise — Data Analysis Prompt

Paste this file into Microsoft Copilot (or any AI assistant) along with your exported NDJSON or CSV data. It tells the assistant exactly what the data means, how every metric is calculated, and what charts to produce.

---

## What you are analysing

This is **GitHub Copilot Enterprise usage data** exported from the GitHub API. Each row (NDJSON line or CSV row) represents one user's activity on one calendar day. The same user can have many rows — one per active day in the export window.

---

## Raw data schema

Each record has these fields:

| Field | Type | Meaning |
|---|---|---|
| `user_login` | string | GitHub username |
| `day` | YYYY-MM-DD | Calendar date of activity |
| `code_generation_activity_count` | integer | How many times Copilot was triggered (suggestions shown, chat prompts sent, agent calls made — including dismissed ones). This is volume, not quality. |
| `code_acceptance_activity_count` | integer | How many completions the user accepted. Only meaningful for code_completion mode — agent mode does not record acceptances. |
| `loc_suggested_to_add_sum` | integer | Lines Copilot offered as ghost text or chat suggestions (user-initiated only). Does NOT include lines written autonomously by agents. |
| `loc_added_sum` | integer | Lines of code actually applied/accepted, across ALL modes including agent. This is the primary output metric. |
| `loc_deleted_sum` | integer | Lines removed by Copilot (agent refactors, dead-code cleanup). Counts as positive value — deleting bad code saves time. |
| `active_time_minutes` | integer | Minutes the user was actively using Copilot. Often 0 in newer exports. |
| `used_agent` | boolean | True if the user used any agent feature at least once that day. |
| `used_chat` | boolean | True if the user used chat at least once that day. |
| `totals_by_ide` | array | Breakdown by IDE (vscode, jetbrains, etc.) with `code_generation_activity_count` and `code_acceptance_activity_count` per IDE. |
| `totals_by_feature` | array | Breakdown by feature key with `code_generation_activity_count`, `code_acceptance_activity_count`, `loc_added_sum`, `loc_deleted_sum` per feature. |
| `totals_by_language_feature` | array | Breakdown by programming language with generation and acceptance counts. |
| `totals_by_language_model` | array | Breakdown by AI model (e.g. `claude-4.5-sonnet`, `gpt-4o`) with generation counts per model. |

### Feature keys in `totals_by_feature`

| Key | What it is |
|---|---|
| `code_completion` | Passive inline ghost-text suggestions (Tab to accept) |
| `agent` | Agent mode — Copilot autonomously reads files, runs commands, iterates |
| `agent_edit` | Copilot Edits panel — multi-file agentic editing with diff review |
| `chat_panel_agent_mode` | Agent mode accessed from the Chat panel |
| `chat_panel_ask_mode` | Ask mode — Q&A, explains code, does not modify files automatically |
| `chat_panel_plan_mode` | Plan mode — produces a step-by-step plan before executing |
| `chat_panel_custom_mode` | Custom-instruction mode (user-defined system prompts) |
| `chat_inline` / `inline_chat` | Inline chat (⌘I / Ctrl+I inside the editor) |
| `chat` | General Copilot Chat (older catch-all, pre-dates Ask/Agent/Plan split) |

**Agent features** (for "agent contribution" calculations): `agent`, `agent_edit`, `chat_panel_agent_mode`, `chat_panel_plan_mode`, `chat_panel_custom_mode`

---

## How to aggregate the data

### Per-user rollup (aggregate all days for each user)

For each unique `user_login`:
- `generations` = sum of `code_generation_activity_count`
- `acceptances` = sum of `code_acceptance_activity_count`
- `linesAdded` = sum of `loc_added_sum`
- `linesDeleted` = sum of `loc_deleted_sum`
- `locSuggested` = sum of `loc_suggested_to_add_sum`
- `daysActive` = count of distinct `day` values
- `usedAgent` = true if any record has `used_agent = true`

### Per-day rollup (aggregate all users for each day)

For each unique `day`:
- `generations` = sum across all users
- `linesAdded` = sum across all users
- `linesDeleted` = sum across all users
- `activeUsers` = count of distinct `user_login` values

### Per-week rollup

Group days into ISO weeks (Monday = week start). For each week:
- `activeUsers` = count of distinct `user_login` values across all days in that week

### Per-feature rollup (from `totals_by_feature`)

For each feature key across all records:
- `generations` = sum of `code_generation_activity_count`
- `linesAdded` = sum of `loc_added_sum`
- `linesDeleted` = sum of `loc_deleted_sum`

### Per-model rollup (from `totals_by_language_model`)

For each model name:
- `generations` = sum of `code_generation_activity_count`

---

## Metrics and formulas

### Activity metrics

| Metric | Formula |
|---|---|
| Total Users | `count of distinct user_login` |
| Total Generations | `sum of code_generation_activity_count` |
| Acceptance Rate | `sum(acceptances) / sum(generations) × 100` — only meaningful for code_completion; agent mode doesn't track acceptances |
| Chat & Inline | `generations from chat + chat_inline + inline_chat features` |
| Avg Daily Users | `mean of activeUsers per day` |

### Lines of Code metrics

| Metric | Formula |
|---|---|
| Lines Added | `sum of loc_added_sum` (all users, all days) |
| Lines Deleted | `sum of loc_deleted_sum` |
| Net Lines | `linesAdded − linesDeleted` |
| Lines Changed with AI | `linesAdded + linesDeleted` — GitHub's headline code generation metric |
| Completion Suggestions | `sum of loc_suggested_to_add_sum` — user-initiated only, cannot be compared directly to Lines Added |

### Estimated value (configurable)

Default assumptions: **$90/hr blended engineering rate**, **30 lines/hr manual coding speed**.

| Metric | Formula |
|---|---|
| Value of Net Lines | `(netLines / 30) × $90` |
| Value of Lines Added | `(linesAdded / 30) × $90` |
| Total Value (added + deleted) | `((linesAdded + linesDeleted) / 30) × $90` |

The logic: if Copilot wrote N lines that a developer would have written manually at 30 lines/hr, and the developer costs $90/hr, then the value is `(N / 30) × 90`.

### Agent contribution

```
agentLinesChanged = sum of (linesAdded + linesDeleted) for agent feature keys only
agentContribution% = agentLinesChanged / (total linesAdded + linesDeleted) × 100
```

Agent feature keys: `agent`, `agent_edit`, `chat_panel_agent_mode`, `chat_panel_plan_mode`, `chat_panel_custom_mode`

This is the same method GitHub uses on its Copilot dashboard.

### Adoption metrics

| Metric | Formula |
|---|---|
| Agent Adoption % | `count of users where usedAgent=true / totalUsers × 100` |
| Agent Users | `count of distinct user_login where used_agent=true in any record` |
| Top Model | `model with highest total generation count from totals_by_language_model` |

---

## Charts to produce

### 1. Daily Lines Changed (grouped bar)
- X axis: date
- Two bars per day: **Lines Added** (green) and **Lines Deleted** (red)
- Shows code velocity and agent refactoring activity over time

### 2. Daily Active Users (line)
- X axis: date
- Y axis: unique users active that day
- Shows adoption trend

### 3. Weekly Active Users (bar)
- X axis: week start (Monday)
- Y axis: unique users active that week (deduplicated across days)
- Smoother view of adoption growth

### 4. Activity Timeline (line)
- X axis: date
- Y axis: total generations per day
- Shows usage intensity over time

### 5. Suggested vs Applied (dual line)
- X axis: date
- Line 1: `loc_suggested_to_add_sum` per day (what Copilot offered)
- Line 2: `loc_added_sum` per day (what was accepted/applied)
- Note: Applied > Suggested is normal — agents write without ghost text

### 6. Lines of Code Trend (dual line)
- X axis: date
- Line 1: cumulative or daily `loc_added_sum`
- Line 2: cumulative or daily `loc_deleted_sum`

### 7. Top Users by Generations (horizontal bar)
- Top 15 users by total `code_generation_activity_count`
- Shows who uses Copilot most frequently

### 8. Top Users by Lines Added (horizontal bar)
- Top 15 users by total `loc_added_sum`
- Shows who gets the most code output from Copilot

### 9. IDE Market Share (pie or bar)
- Source: `totals_by_ide`
- Segments: one per IDE, sized by generation count

### 10. Language Distribution (bar)
- Source: `totals_by_language_feature`
- Top 10 languages by generation count

### 11. Feature Usage (bar)
- Source: `totals_by_feature`
- One bar per feature key, sorted by generation count descending
- Use human-readable labels (see feature key table above)

### 12. Model Distribution (pie or bar)
- Source: `totals_by_language_model`
- One segment per model, sized by generation count

### 13. Feature Adoption (% of users)
- For each feature: `count of users who used it / total users × 100`
- A user "used" a feature if any of their `totals_by_feature` entries for that feature have `code_generation_activity_count > 0`

---

## Insights to flag automatically

Run these checks and report findings:

| Insight | Rule |
|---|---|
| **Power Users** | Top 10% of users by `generations` — list up to 5 names with counts |
| **High Efficiency** | Users with ≥50 generations AND acceptance rate ≥70% — list up to 5 |
| **Spotlight Users** | Top 5 users by `linesAdded` — these are where AI is visibly writing code |
| **Daily Quota Exceeded** | Any user-day where `code_generation_activity_count > 500` |
| **Week-over-Week Trend** | Compare last 7 days vs prior 7 days: `(recent − previous) / previous × 100%` |
| **Zero Acceptance Days** | Count of user-days where `generations > 0` AND `acceptances = 0` — expected in agent mode, not necessarily a concern |

---

## Important caveats

1. **`loc_suggested_to_add_sum` ≠ `loc_added_sum`**: Suggested only covers user-initiated completions and chat inserts. Agent mode writes code autonomously without showing ghost text, so `linesAdded` will always exceed `locSuggested`. Do not compute a "line acceptance rate" by dividing them — it will exceed 100%.

2. **Acceptance rate is only meaningful for code_completion**: Agent mode does not record acceptances because there is nothing to accept or reject — it just writes. If your data is heavily agent-oriented, an overall acceptance rate near 0% is normal.

3. **Lines Deleted is positive value**: Copilot-assisted deletion (refactors, dead code removal) saves engineering time. It should be counted alongside lines added when estimating value, not subtracted.

4. **`active_time_minutes` is often 0**: GitHub stopped reliably populating this field in late 2024. Do not use it for time-based analysis unless you confirm it has values in your export.

5. **Export windows overlap**: GitHub Copilot Enterprise exports use 28-day rolling windows. If you have multiple exports, deduplicate by taking `max` of all numeric fields for the same `user_login + day` combination before aggregating.

---

## Suggested analysis questions

- Who are the top 10 users by lines of code added with AI assistance?
- What percentage of total code changes came from agent features vs completions?
- How has daily active user count trended over the export period?
- Which IDE is most used, and does acceptance rate differ by IDE?
- Which programming languages have the highest Copilot usage?
- What is the week-over-week trend in total generations?
- How many users have adopted agent mode vs chat vs completions only?
- What is the estimated dollar value of code produced, assuming $90/hr and 30 lines/hr manual speed?
- Which AI model is used most, and has model preference shifted over time?
