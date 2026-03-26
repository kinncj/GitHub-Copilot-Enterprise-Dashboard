# GitHub Copilot Enterprise — Analysis Context

Each record = one user's activity on one day. Fields:

| Field | Meaning |
|---|---|
| `user_login` | GitHub username |
| `day` | YYYY-MM-DD |
| `code_generation_activity_count` | Copilot triggers (suggestions, chat prompts, agent calls — including dismissed) |
| `code_acceptance_activity_count` | Completions accepted. Only meaningful for code_completion; agent mode has no acceptances. |
| `loc_suggested_to_add_sum` | Lines offered as ghost text / chat suggestions (user-initiated only, not agent writes) |
| `loc_added_sum` | Lines actually applied, all modes including agent |
| `loc_deleted_sum` | Lines removed by Copilot (agent refactors). Positive value, not a cost. |
| `used_agent` | true if user used any agent feature that day |
| `totals_by_ide` | Array: `{ide, code_generation_activity_count, code_acceptance_activity_count}` |
| `totals_by_feature` | Array: `{feature, code_generation_activity_count, code_acceptance_activity_count, loc_added_sum, loc_deleted_sum}` |
| `totals_by_language_feature` | Array: `{language, code_generation_activity_count, code_acceptance_activity_count}` |
| `totals_by_language_model` | Array: `{model, code_generation_activity_count}` |

**Agent feature keys** (used in agent contribution calc): `agent`, `agent_edit`, `chat_panel_agent_mode`, `chat_panel_plan_mode`, `chat_panel_custom_mode`

**Other feature keys**: `code_completion`, `chat`, `chat_inline`, `inline_chat`, `chat_panel_ask_mode`

---

## Aggregation

**Per user** (sum all days): `generations`, `acceptances`, `linesAdded`, `linesDeleted`, `locSuggested`, `daysActive` (distinct days), `usedAgent` (true if any record has used_agent=true)

**Per day** (sum all users): `generations`, `linesAdded`, `linesDeleted`, `activeUsers` (distinct user_login count)

**Per week** (Monday start): `activeUsers` = distinct users across all days in that week

**Per feature** (from totals_by_feature, all records): sum `generations`, `linesAdded`, `linesDeleted`

**Per model** (from totals_by_language_model): sum `generations`

---

## Metrics & Formulas

| Metric | Formula |
|---|---|
| Acceptance Rate | `sum(acceptances) / sum(generations) × 100` — completions only |
| Lines Changed with AI | `linesAdded + linesDeleted` — GitHub's headline metric |
| Net Lines | `linesAdded − linesDeleted` |
| Agent Contribution % | `sum(linesAdded+linesDeleted for agent features only) / (linesAdded+linesDeleted total) × 100` |
| Agent Adoption % | `users with usedAgent=true / totalUsers × 100` |
| Top Model | model with highest total generation count |
| Avg Daily Users | mean of `activeUsers` per day |
| Estimated Value | `(lines / 30) × $90` — assumes 30 lines/hr manual speed, $90/hr blended rate |
| Value (net) | `(netLines / 30) × $90` |
| Value (total activity) | `((linesAdded + linesDeleted) / 30) × $90` |

---

## Charts to produce

1. **Daily Lines Changed** — grouped bar per day: Lines Added (green) + Lines Deleted (red)
2. **Daily Active Users** — line chart, unique users per day
3. **Weekly Active Users** — bar chart, unique users per week (Monday start, deduplicated)
4. **Activity Timeline** — line chart, total generations per day
5. **Suggested vs Applied** — dual line: `loc_suggested_to_add_sum` vs `loc_added_sum` per day
6. **Top 15 Users by Generations** — horizontal bar
7. **Top 15 Users by Lines Added** — horizontal bar
8. **IDE Market Share** — pie/bar from `totals_by_ide`, sized by generations
9. **Language Distribution** — bar, top 10 languages by generations from `totals_by_language_feature`
10. **Feature Usage** — bar, all features sorted by generations descending
11. **Model Distribution** — pie/bar from `totals_by_language_model`
12. **Feature Adoption** — % of users who used each feature (user used feature if any record has that feature with generations > 0)

---

## Insights to flag

| Check | Rule |
|---|---|
| Power Users | Top 10% by generations — list up to 5 |
| High Efficiency | Users with ≥50 generations AND acceptance rate ≥70% |
| Spotlight Users | Top 5 by linesAdded |
| Quota Exceeded | Any user-day where generations > 500 |
| Week-over-Week | `(last 7 days total gens − prior 7 days) / prior 7 days × 100%` |
| Zero Acceptance Days | Count of user-days where generations > 0 AND acceptances = 0 (normal in agent mode) |

---

## Critical caveats

- **Do not divide `loc_added_sum` by `loc_suggested_to_add_sum`** — result will exceed 100% because agents write code without ghost text
- **Acceptance rate near 0% is normal** if most activity is agent mode (agent mode has no accept/reject)
- **Lines deleted = positive value** — count it alongside lines added when estimating savings
- **`active_time_minutes` is often 0** in recent exports — do not use for time analysis
- **Deduplicate before aggregating** if using multiple overlapping exports: for same `user_login + day`, take `max` of all numeric fields
