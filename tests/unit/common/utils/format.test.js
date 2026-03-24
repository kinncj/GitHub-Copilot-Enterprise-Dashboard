import { describe, it, expect } from 'vitest';
import { formatNumber, humanizeFeature } from '../../../../common/utils/format.js';

describe('formatNumber', () => {
  it('formats numbers below 1000 as-is', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(42)).toBe('42');
  });

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('formats millions with M suffix', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M');
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });

  it('formats billions with B suffix', () => {
    expect(formatNumber(1_000_000_000)).toBe('1.0B');
    expect(formatNumber(3_200_000_000)).toBe('3.2B');
  });
});

describe('humanizeFeature', () => {
  it('returns known feature metadata', () => {
    const result = humanizeFeature('code_completion');
    expect(result.label).toBe('Code Completion');
    expect(result.short).toBe('Completions');
    expect(result.icon).toBe('code-2');
    expect(result.desc).toBeTruthy();
  });

  it('returns all known features', () => {
    const knownKeys = [
      'code_completion', 'chat_panel_agent_mode', 'chat_panel_ask_mode',
      'chat_panel_plan_mode', 'chat_panel_custom_mode', 'chat_panel_unknown_mode',
      'agent_edit', 'agent', 'chat_inline', 'inline_chat', 'chat'
    ];
    for (const key of knownKeys) {
      const result = humanizeFeature(key);
      expect(result.label, `missing label for ${key}`).toBeTruthy();
      expect(result.short, `missing short for ${key}`).toBeTruthy();
      expect(result.icon,  `missing icon for ${key}`).toBeTruthy();
    }
  });

  it('falls back gracefully for unknown keys', () => {
    const result = humanizeFeature('some_new_feature');
    expect(result.label).toBe('Some New Feature');
    expect(result.short).toBe('Some New Feature');
    expect(result.icon).toBe('activity');
    expect(result.desc).toContain('some_new_feature');
  });

  it('capitalises each word in fallback', () => {
    const result = humanizeFeature('multi_word_feature_key');
    expect(result.label).toBe('Multi Word Feature Key');
  });
});
