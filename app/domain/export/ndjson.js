/**
 * Serialises CopilotRecord[] back to an NDJSON string.
 * @param {import('../../../common/types/index.js').CopilotRecord[]} records
 * @returns {string}
 */
export function buildNDJSON(records) {
  return records.map(r => JSON.stringify(r)).join('\n');
}
