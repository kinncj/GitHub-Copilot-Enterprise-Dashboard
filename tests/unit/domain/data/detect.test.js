import { describe, it, expect } from 'vitest';
import { detectFileType } from '../../../../app/domain/data/detect.js';

describe('detectFileType', () => {
  it('detects NDJSON by leading brace regardless of extension', () => {
    expect(detectFileType('export.ndjson', '{"user_login":"a","day":"2026-01-01"}')).toBe('activity');
    expect(detectFileType('mystery.txt', '{"user_login":"a"}')).toBe('activity');
  });

  it('detects an AI Usage CSV by its full header signature', () => {
    const header = '"date","username","product","sku","model","quantity","unit_type"';
    expect(detectFileType('AIUsageReport_1.csv', header + '\n"2026-06-01","a",...')).toBe('aiusage');
  });

  it('detects an AI Usage CSV through a BOM prefix', () => {
    const header = '﻿"date","username","quantity","unit_type","sku"';
    expect(detectFileType('report.csv', header)).toBe('aiusage');
  });

  it('does NOT misroute a partial/lookalike CSV (e.g. seat report)', () => {
    // has username + quantity but lacks the cost/model/sku columns
    expect(detectFileType('seats.csv', '"username","quantity"\n"a","5"')).toBe('activity');
  });

  it('falls back to activity for unrecognised csv headers', () => {
    expect(detectFileType('other.csv', 'a,b,c\n1,2,3')).toBe('activity');
  });

  it('defaults to activity for empty input', () => {
    expect(detectFileType('x.json', '')).toBe('activity');
  });
});
