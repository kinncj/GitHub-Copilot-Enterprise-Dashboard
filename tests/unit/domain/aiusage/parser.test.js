import { describe, it, expect } from 'vitest';
import { stripBOM, parseCSVRows, normalizeAIUsageRecord, parseAIUsageCSV } from '../../../../app/domain/aiusage/parser.js';

const HEADER = '"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","total_monthly_quota","organization","repository","cost_center_name","aic_quantity","aic_gross_amount"';
const ROW = '"2026-06-01","alice","copilot","copilot_ai_credit","Auto: Claude Haiku 4.5","16.44","ai-credits","0.01","0.1644","0.1644","0","3900","Org-A","","P&T","16.44","0.1644"';

describe('stripBOM', () => {
  it('removes a leading BOM', () => {
    expect(stripBOM('﻿hello')).toBe('hello');
  });
  it('leaves BOM-less text untouched', () => {
    expect(stripBOM('hello')).toBe('hello');
  });
});

describe('parseCSVRows', () => {
  it('parses simple rows', () => {
    expect(parseCSVRows('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });
  it('handles quoted fields with commas inside', () => {
    expect(parseCSVRows('"x,y",z')).toEqual([['x,y', 'z']]);
  });
  it('handles escaped double-quotes', () => {
    expect(parseCSVRows('"she said ""hi""",b')).toEqual([['she said "hi"', 'b']]);
  });
  it('handles CRLF line endings and trailing newline', () => {
    expect(parseCSVRows('a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('skips fully blank lines', () => {
    expect(parseCSVRows('a,b\n\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('handles newlines inside quoted fields', () => {
    expect(parseCSVRows('"line1\nline2",b')).toEqual([['line1\nline2', 'b']]);
  });
});

describe('normalizeAIUsageRecord', () => {
  const idx = {};
  parseCSVRows(HEADER)[0].forEach((h, i) => { idx[h.trim().toLowerCase()] = i; });
  const cells = parseCSVRows(ROW)[0];

  it('maps columns by header and coerces numbers', () => {
    const r = normalizeAIUsageRecord(cells, idx);
    expect(r.username).toBe('alice');
    expect(r.date).toBe('2026-06-01');
    expect(r.quantity).toBeCloseTo(16.44);
    expect(r.grossAmount).toBeCloseTo(0.1644);
    expect(r.monthlyQuota).toBe(3900);
    expect(r.costCenter).toBe('P&T');
  });

  it('detects auto-routed models and strips the prefix', () => {
    const r = normalizeAIUsageRecord(cells, idx);
    expect(r.isAuto).toBe(true);
    expect(r.baseModel).toBe('Claude Haiku 4.5');
  });

  it('treats explicit models as non-auto', () => {
    const c = [...cells]; c[idx['model']] = 'Claude Sonnet 4.6';
    const r = normalizeAIUsageRecord(c, idx);
    expect(r.isAuto).toBe(false);
    expect(r.baseModel).toBe('Claude Sonnet 4.6');
  });

  it('returns null when username or date is missing', () => {
    const c = [...cells]; c[idx['username']] = '';
    expect(normalizeAIUsageRecord(c, idx)).toBeNull();
  });
});

describe('parseAIUsageCSV', () => {
  it('parses a BOM-prefixed CSV into records', async () => {
    const text = '﻿' + HEADER + '\n' + ROW + '\n';
    const records = await parseAIUsageCSV(text);
    expect(records).toHaveLength(1);
    expect(records[0].username).toBe('alice');
    expect(records[0].isAuto).toBe(true);
  });

  it('returns [] for header-only or empty input', async () => {
    expect(await parseAIUsageCSV('')).toEqual([]);
    expect(await parseAIUsageCSV(HEADER)).toEqual([]);
  });

  it('reports progress', async () => {
    const text = HEADER + '\n' + ROW;
    let last = 0;
    await parseAIUsageCSV(text, { onProgress: p => { last = p; } });
    expect(last).toBe(100);
  });

  it('is column-order independent', async () => {
    const text = '"username","date","quantity","model"\n"bob","2026-06-02","5","GPT-5.4"';
    const records = await parseAIUsageCSV(text);
    expect(records[0]).toMatchObject({ username: 'bob', date: '2026-06-02', quantity: 5, baseModel: 'GPT-5.4' });
  });
});
