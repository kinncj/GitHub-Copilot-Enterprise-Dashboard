/**
 * Central application state.
 * Single source of truth — presentation layer reads from here, domain
 * functions receive slices as arguments (no direct state imports in domain/).
 */
export const state = {
  /** @type {import('../../common/types/index.js').CopilotRecord[]} */
  rawData: [],

  /** @type {{ name: string, records: number }[]} */
  loadedFiles: [],

  /** @type {import('../../common/types/index.js').CopilotRecord[]} */
  filteredData: [],

  /** @type {import('../../common/types/index.js').AggregatedData} */
  aggregatedData: {},

  /** @type {Record<string, import('chart.js').Chart>} */
  charts: {},

  /** @type {import('../../common/types/index.js').FilterCriteria} */
  filters: {
    dateFrom:  null,
    dateTo:    null,
    user:      null,
    ide:       null,
    language:  null
  },

  sortColumn:    /** @type {string|null} */ null,
  sortDirection: /** @type {'asc'|'desc'} */ 'asc'
};

/**
 * Resets state to its initial shape (does not create a new object — mutates in place
 * so that existing references to `state` remain valid).
 */
export function resetState() {
  state.rawData        = [];
  state.loadedFiles    = [];
  state.filteredData   = [];
  state.aggregatedData = {};
  state.charts         = {};
  state.filters        = { dateFrom: null, dateTo: null, user: null, ide: null, language: null };
  state.sortColumn     = null;
  state.sortDirection  = 'asc';
}
