/**
 * JSDoc type definitions for the dashboard domain model.
 * No runtime code — import this file only for IDE type hints.
 */

/**
 * @typedef {Object} CopilotRecord
 * @property {string} user_login
 * @property {string} day - ISO date string YYYY-MM-DD
 * @property {number} code_generation_activity_count
 * @property {number} code_acceptance_activity_count
 * @property {number} loc_added_sum
 * @property {number} loc_deleted_sum
 * @property {number} active_time_minutes
 * @property {IdeEntry[]} totals_by_ide
 * @property {FeatureEntry[]} totals_by_feature
 * @property {LanguageFeatureEntry[]} totals_by_language_feature
 * @property {LanguageModelEntry[]} totals_by_language_model
 * @property {ModelFeatureEntry[]} totals_by_model_feature
 * @property {string} model
 */

/**
 * @typedef {Object} IdeEntry
 * @property {string} ide
 * @property {number} [code_generation_activity_count]
 * @property {number} [code_acceptance_activity_count]
 */

/**
 * @typedef {Object} FeatureEntry
 * @property {string} feature
 * @property {number} [code_generation_activity_count]
 * @property {number} [code_acceptance_activity_count]
 * @property {number} [count]
 */

/**
 * @typedef {Object} LanguageFeatureEntry
 * @property {string} language
 * @property {string} feature
 * @property {number} [code_generation_activity_count]
 * @property {number} [code_acceptance_activity_count]
 */

/**
 * @typedef {Object} LanguageModelEntry
 * @property {string} language
 * @property {string} model
 * @property {number} [code_generation_activity_count]
 */

/**
 * @typedef {Object} ModelFeatureEntry
 * @property {string} model
 * @property {string} feature
 * @property {number} [code_generation_activity_count]
 */

/**
 * @typedef {Object} FilterCriteria
 * @property {string|null} dateFrom
 * @property {string|null} dateTo
 * @property {string|null} user
 * @property {string|null} ide
 * @property {string|null} language
 */

/**
 * @typedef {Object} UserAggregate
 * @property {number} generations
 * @property {number} acceptances
 * @property {number} linesAdded
 * @property {number} linesDeleted
 * @property {number} activeTime
 * @property {Set<string>} days
 * @property {Set<string>} features
 */

/**
 * @typedef {Object} DayAggregate
 * @property {number} generations
 * @property {number} acceptances
 * @property {number} linesAdded
 * @property {number} linesDeleted
 * @property {number} chatCount
 * @property {number} activeUsers
 */

/**
 * @typedef {Object} AggregatedData
 * @property {Object.<string, UserAggregate>} byUser
 * @property {Object.<string, DayAggregate>} byDay
 * @property {Object.<string, {generations: number, acceptances: number}>} byIDE
 * @property {Object.<string, {generations: number, acceptances: number}>} byLanguage
 * @property {Object.<string, {generations: number, acceptances: number}>} byFeature
 * @property {Object.<string, number>} byModel
 */

/**
 * @typedef {Object} Insight
 * @property {string} title
 * @property {string} subtitle
 * @property {'success'|'warning'|'error'|'info'} type
 * @property {string} icon
 * @property {string} content
 */

/**
 * @typedef {Object} ValueConfig
 * @property {number} MANUAL_LINES_PER_HOUR
 * @property {number} BLENDED_RATE_PER_HOUR
 */

/**
 * One row of a GitHub AI Usage Report CSV — AI-credit consumption / billing.
 * Distinct from CopilotRecord (which is code-activity). Never merged with it.
 * @typedef {Object} AIUsageRecord
 * @property {string} date - ISO date string YYYY-MM-DD
 * @property {string} username
 * @property {string} product - e.g. "copilot"
 * @property {string} sku - e.g. "copilot_ai_credit", "coding_agent_ai_credit"
 * @property {string} model - raw model label, may be prefixed "Auto: "
 * @property {string} baseModel - model with the "Auto: " prefix stripped
 * @property {boolean} isAuto - true when the model was auto-routed ("Auto: ...")
 * @property {number} quantity - AI credits consumed (fractional)
 * @property {string} unitType - e.g. "ai-credits"
 * @property {number} costPerQuantity - applied cost per credit (USD)
 * @property {number} grossAmount - gross USD value of consumption
 * @property {number} discountAmount - USD discounted
 * @property {number} netAmount - net USD billed (often 0 under quota)
 * @property {number} monthlyQuota - the user's total monthly credit quota
 * @property {string} organization
 * @property {string} repository
 * @property {string} costCenter
 * @property {number} aicQuantity - AI-credit quantity (mirror of quantity)
 * @property {number} aicGrossAmount - AI-credit gross USD (mirror of grossAmount)
 */

/**
 * @typedef {Object} AIUsageAggregated
 * @property {{credits: number, gross: number, net: number, discount: number}} totals
 * @property {Object.<string, {credits: number, gross: number, net: number, quota: number, days: Set<string>, models: Set<string>, daysActive: number, modelCount: number}>} byUser
 * @property {Object.<string, {credits: number, gross: number, net: number, activeUsers: number}>} byDay
 * @property {Object.<string, {credits: number, gross: number, auto: number, manual: number}>} byModel
 * @property {Object.<string, {credits: number, gross: number, net: number}>} byOrg
 * @property {Object.<string, {credits: number, gross: number, net: number}>} byCostCenter
 * @property {Object.<string, {credits: number, gross: number, net: number}>} bySku
 */

/**
 * @typedef {Object} BudgetLine
 * @property {number} budget - credit budget (quota)
 * @property {number} consumed - credits consumed so far
 * @property {number} projected - run-rate projection to month end
 * @property {number} remaining - budget - consumed
 * @property {number} consumedPct - consumed / budget
 * @property {number} projectedPct - projected / budget
 */

/**
 * @typedef {Object} AIUsageBudget
 * @property {BudgetLine & {gross: number, daysObserved: number, daysInMonth: number, dayOfMonth: number, remainingDays: number, factor: number, minDate: string, maxDate: string, month: string, users: number}} enterprise
 * @property {Object.<string, BudgetLine & {users: number}>} byOrg
 * @property {Object.<string, BudgetLine>} byUser
 */

/**
 * @typedef {Object} AIUsageCriteria
 * @property {string|null} dateFrom
 * @property {string|null} dateTo
 * @property {string|null} user
 * @property {string|null} model
 * @property {string|null} org
 * @property {string|null} costCenter
 */
