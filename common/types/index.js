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
