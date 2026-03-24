import { FEATURE_LABELS } from '../../app/domain/config/constants.js';

/**
 * Compact number formatter: 1500 → "1.5K", 2000000 → "2.0M".
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)         return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

/**
 * Returns human-readable metadata for a Copilot feature key.
 * Falls back to a capitalised, underscore-stripped version for unknown keys.
 * @param {string} key
 * @returns {{ label: string, short: string, icon: string, desc: string }}
 */
export function humanizeFeature(key) {
  if (FEATURE_LABELS[key]) return FEATURE_LABELS[key];
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label, short: label, icon: 'activity', desc: `Raw feature key: ${key}` };
}
