import { useState, useCallback, useMemo } from 'react';
import { parseNDJSON } from '../domain/data/parser.js';
import { mergeRecords } from '../domain/data/merger.js';
import { detectFileType } from '../domain/data/detect.js';
import { filterRecords, extractFilterOptions } from '../domain/filtering/engine.js';
import { aggregateData } from '../domain/data/aggregator.js';
import { generateInsights } from '../domain/insights/engine.js';
import { parseAIUsageCSV } from '../domain/aiusage/parser.js';
import { filterAIUsage, extractAIUsageFilterOptions } from '../domain/aiusage/filtering.js';
import { aggregateAIUsage } from '../domain/aiusage/aggregator.js';
import { generateAIUsageInsights } from '../domain/aiusage/insights.js';
import { computeAIUsageBudget, generateBudgetInsights } from '../domain/aiusage/budget.js';
import { CONFIG } from '../domain/config/constants.js';

const EMPTY_FILTERS = { dateFrom: null, dateTo: null, user: null, ide: null, language: null };
const EMPTY_AI_FILTERS = { dateFrom: null, dateTo: null, user: null, model: null, org: null, costCenter: null };

export function useAppState() {
  // ── Activity dataset (NDJSON) ──────────────────────────────────────────────
  const [rawData, setRawData] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // ── AI Usage dataset (CSV) ─────────────────────────────────────────────────
  const [aiUsageRaw, setAiUsageRaw] = useState([]);
  const [aiUsageFiles, setAiUsageFiles] = useState([]);
  const [aiUsageFilters, setAiUsageFilters] = useState(EMPTY_AI_FILTERS);

  // ── Shared / UI ────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState('activity'); // 'activity' | 'aiusage'
  const [valueConfig, setValueConfig] = useState({
    MANUAL_LINES_PER_HOUR: CONFIG.MANUAL_LINES_PER_HOUR,
    BLENDED_RATE_PER_HOUR: CONFIG.BLENDED_RATE_PER_HOUR
  });
  // License config is dataset-specific (seats per org/tier), so it is in-memory
  // only — never persisted — and is cleared whenever the dataset changes.
  const [licenseConfig, setLicenseConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ label: '', pct: 0 });

  // ── Derived: activity (memoized — recompute only when inputs change) ────────
  const filteredData = useMemo(() => filterRecords(rawData, filters), [rawData, filters]);
  const aggregatedData = useMemo(() => aggregateData(filteredData), [filteredData]);
  const insights = useMemo(() => generateInsights(aggregatedData, filteredData, CONFIG), [aggregatedData, filteredData]);
  const filterOptions = useMemo(() => extractFilterOptions(rawData), [rawData]);

  // ── Derived: AI usage (memoized) ────────────────────────────────────────────
  const aiUsageFiltered = useMemo(() => filterAIUsage(aiUsageRaw, aiUsageFilters), [aiUsageRaw, aiUsageFilters]);
  const aiUsageAggregated = useMemo(() => aggregateAIUsage(aiUsageFiltered), [aiUsageFiltered]);
  const aiUsageBudget = useMemo(() => computeAIUsageBudget(aiUsageFiltered, licenseConfig), [aiUsageFiltered, licenseConfig]);
  const aiUsageInsights = useMemo(() => [
    ...generateBudgetInsights(aiUsageBudget, CONFIG),
    ...generateAIUsageInsights(aiUsageAggregated, aiUsageFiltered, CONFIG)
  ], [aiUsageBudget, aiUsageAggregated, aiUsageFiltered]);
  const aiUsageFilterOptions = useMemo(() => extractAIUsageFilterOptions(aiUsageRaw), [aiUsageRaw]);

  const hasActivity = rawData.length > 0;
  const hasAIUsage = aiUsageRaw.length > 0;

  const loadFiles = useCallback(async (files, append = false) => {
    setLoading(true);
    // A fresh (non-append) load replaces the dataset, so any license config
    // tuned for the previous dataset no longer applies.
    if (!append) setLicenseConfig(null);

    let activityData = append ? rawData : [];
    let activityFiles = append ? [...loadedFiles] : [];
    let usageData = append ? aiUsageRaw : [];
    let usageFiles = append ? [...aiUsageFiles] : [];

    let loadedActivity = false;
    let loadedUsage = false;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({
          label: files.length > 1 ? `File ${i + 1} of ${files.length}: ${file.name}` : file.name,
          pct: 0
        });
        const text = await file.text();
        const onProgress = pct => setProgress(prev => ({ ...prev, pct }));

        if (detectFileType(file.name, text) === 'aiusage') {
          const records = await parseAIUsageCSV(text, { onProgress });
          usageData = [...usageData, ...records];
          usageFiles = [...usageFiles, { name: file.name, records: records.length }];
          loadedUsage = true;
        } else {
          const records = await parseNDJSON(text, { onProgress });
          activityData = [...activityData, ...records];
          activityFiles = [...activityFiles, { name: file.name, records: records.length }];
          loadedActivity = true;
        }
      }

      // ── Commit activity ──
      if (loadedActivity) {
        const merged = mergeRecords(activityData);
        const allDates = merged.map(r => r.day).sort();
        setRawData(merged);
        setLoadedFiles(activityFiles);
        setFilters({
          ...EMPTY_FILTERS,
          dateFrom: allDates[0] || null,
          dateTo: allDates[allDates.length - 1] || null
        });
      }

      // ── Commit AI usage (dedup by date|user|sku|model) ──
      if (loadedUsage) {
        const seen = new Set();
        const deduped = [];
        for (const r of usageData) {
          const key = `${r.date}|${r.username}|${r.sku}|${r.model}`;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(r);
        }
        const allDates = deduped.map(r => r.date).sort();
        setAiUsageRaw(deduped);
        setAiUsageFiles(usageFiles);
        setAiUsageFilters({
          ...EMPTY_AI_FILTERS,
          dateFrom: allDates[0] || null,
          dateTo: allDates[allDates.length - 1] || null
        });
      }

      // ── Focus the view that was just loaded ──
      if (loadedUsage && !loadedActivity) setActiveView('aiusage');
      else if (loadedActivity && !loadedUsage) setActiveView('activity');
    } catch (err) {
      alert('Error parsing file: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [rawData, loadedFiles, aiUsageRaw, aiUsageFiles]);

  const resetData = useCallback(() => {
    setRawData([]);
    setLoadedFiles([]);
    setFilters(EMPTY_FILTERS);
    setAiUsageRaw([]);
    setAiUsageFiles([]);
    setAiUsageFilters(EMPTY_AI_FILTERS);
    setLicenseConfig(null);
    setActiveView('activity');
    setLoading(false);
  }, []);

  return {
    // activity
    rawData, loadedFiles, filteredData, aggregatedData, insights,
    filters, setFilters, filterOptions,
    // ai usage
    aiUsageRaw, aiUsageFiles, aiUsageFiltered, aiUsageAggregated, aiUsageInsights, aiUsageBudget,
    aiUsageFilters, setAiUsageFilters, aiUsageFilterOptions,
    // shared
    hasActivity, hasAIUsage, activeView, setActiveView,
    valueConfig, setValueConfig,
    licenseConfig, setLicenseConfig,
    loading, progress, loadFiles, resetData
  };
}
