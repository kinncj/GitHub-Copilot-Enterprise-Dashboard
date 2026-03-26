import { describe, it, expect } from 'vitest';
import { normalizeRecord, parseNDJSON } from '../../../../app/domain/data/parser.js';

// ─── normalizeRecord ──────────────────────────────────────────────────────────

describe('normalizeRecord', () => {
  it('returns null for non-objects', () => {
    expect(normalizeRecord(null)).toBeNull();
    expect(normalizeRecord('string')).toBeNull();
    expect(normalizeRecord(42)).toBeNull();
  });

  it('returns null when user_login is missing', () => {
    expect(normalizeRecord({ day: '2025-01-01' })).toBeNull();
  });

  it('returns null when day is missing', () => {
    expect(normalizeRecord({ user_login: 'alice' })).toBeNull();
  });

  it('normalises numeric fields from strings', () => {
    const record = normalizeRecord({
      user_login: 'alice',
      day: '2025-01-01',
      code_generation_activity_count: '42',
      loc_added_sum: '100',
      loc_deleted_sum: '10'
    });
    expect(record.code_generation_activity_count).toBe(42);
    expect(record.loc_added_sum).toBe(100);
    expect(record.loc_deleted_sum).toBe(10);
  });

  it('defaults numeric fields to 0 when absent', () => {
    const record = normalizeRecord({ user_login: 'alice', day: '2025-01-01' });
    expect(record.code_generation_activity_count).toBe(0);
    expect(record.code_acceptance_activity_count).toBe(0);
    expect(record.loc_suggested_to_add_sum).toBe(0);
    expect(record.loc_added_sum).toBe(0);
    expect(record.loc_deleted_sum).toBe(0);
    expect(record.active_time_minutes).toBe(0);
  });

  it('parses loc_suggested_to_add_sum', () => {
    const record = normalizeRecord({ user_login: 'alice', day: '2025-01-01', loc_suggested_to_add_sum: '250' });
    expect(record.loc_suggested_to_add_sum).toBe(250);
  });

  it('defaults nested arrays to [] when absent', () => {
    const record = normalizeRecord({ user_login: 'alice', day: '2025-01-01' });
    expect(record.totals_by_ide).toEqual([]);
    expect(record.totals_by_feature).toEqual([]);
    expect(record.totals_by_language_feature).toEqual([]);
    expect(record.totals_by_language_model).toEqual([]);
    expect(record.totals_by_model_feature).toEqual([]);
  });

  it('preserves nested arrays when present', () => {
    const ide = [{ ide: 'vscode', code_generation_activity_count: 5 }];
    const record = normalizeRecord({ user_login: 'alice', day: '2025-01-01', totals_by_ide: ide });
    expect(record.totals_by_ide).toEqual(ide);
  });

  it('defaults model to "unknown" when missing', () => {
    const record = normalizeRecord({ user_login: 'alice', day: '2025-01-01' });
    expect(record.model).toBe('unknown');
  });

  it('preserves model when present', () => {
    const record = normalizeRecord({ user_login: 'alice', day: '2025-01-01', model: 'gpt-4' });
    expect(record.model).toBe('gpt-4');
  });

  it('coerces user_login and day to strings', () => {
    const record = normalizeRecord({ user_login: 123, day: 20250101 });
    expect(record.user_login).toBe('123');
    expect(record.day).toBe('20250101');
  });
});

// ─── parseNDJSON ──────────────────────────────────────────────────────────────

describe('parseNDJSON', () => {
  it('parses valid NDJSON text into records', async () => {
    const ndjson = [
      JSON.stringify({ user_login: 'alice', day: '2025-01-01', code_generation_activity_count: 10 }),
      JSON.stringify({ user_login: 'bob',   day: '2025-01-02', code_generation_activity_count: 20 })
    ].join('\n');

    const records = await parseNDJSON(ndjson);
    expect(records).toHaveLength(2);
    expect(records[0].user_login).toBe('alice');
    expect(records[1].user_login).toBe('bob');
  });

  it('skips malformed JSON lines without throwing', async () => {
    const ndjson = [
      JSON.stringify({ user_login: 'alice', day: '2025-01-01' }),
      'NOT JSON {{{',
      JSON.stringify({ user_login: 'bob', day: '2025-01-02' })
    ].join('\n');

    const records = await parseNDJSON(ndjson);
    expect(records).toHaveLength(2);
  });

  it('skips records without user_login or day', async () => {
    const ndjson = [
      JSON.stringify({ user_login: 'alice', day: '2025-01-01' }),
      JSON.stringify({ user_login: 'no-day' }),
      JSON.stringify({ day: '2025-01-01' })
    ].join('\n');

    const records = await parseNDJSON(ndjson);
    expect(records).toHaveLength(1);
  });

  it('skips blank lines', async () => {
    const ndjson = '\n' + JSON.stringify({ user_login: 'alice', day: '2025-01-01' }) + '\n\n';
    const records = await parseNDJSON(ndjson);
    expect(records).toHaveLength(1);
  });

  it('calls onProgress with 100 at completion', async () => {
    const line = JSON.stringify({ user_login: 'alice', day: '2025-01-01' });
    const progress = [];
    await parseNDJSON(line, { onProgress: pct => progress.push(pct) });
    expect(progress[progress.length - 1]).toBe(100);
  });

  it('returns empty array for empty input', async () => {
    const records = await parseNDJSON('');
    expect(records).toEqual([]);
  });
});
