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
 * Compact USD formatter: 1500 → "$1.5K", 0.164 → "$0.16", 12 → "$12".
 * Sub-$1 amounts keep two decimals; whole-dollar amounts drop them.
 * @param {number} num
 * @returns {string}
 */
export function formatCurrency(num) {
  const sign = num < 0 ? '-' : '';
  const n = Math.abs(num);
  if (n >= 1_000_000) return `${sign}$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${sign}$${(n / 1_000).toFixed(1)}K`;
  if (n > 0 && n < 1) return `${sign}$${n.toFixed(2)}`;
  return `${sign}$${Math.round(n).toLocaleString()}`;
}

/**
 * Compact AI-credit formatter. Credits are fractional, so values below 1000
 * are shown with one decimal (trailing ".0" stripped); larger values use K/M.
 * @param {number} num
 * @returns {string}
 */
export function formatCredits(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
  return num.toFixed(1).replace(/\.0$/, '');
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
