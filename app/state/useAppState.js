import { useState, useCallback } from 'react';
import { parseNDJSON } from '../domain/data/parser.js';
import { mergeRecords } from '../domain/data/merger.js';
import { filterRecords, extractFilterOptions } from '../domain/filtering/engine.js';
import { aggregateData } from '../domain/data/aggregator.js';
import { generateInsights } from '../domain/insights/engine.js';
import { CONFIG } from '../domain/config/constants.js';

export function useAppState() {
  const [rawData, setRawData] = useState([]);
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: null, dateTo: null, user: null, ide: null, language: null });
  const [valueConfig, setValueConfig] = useState({
    MANUAL_LINES_PER_HOUR: CONFIG.MANUAL_LINES_PER_HOUR,
    BLENDED_RATE_PER_HOUR: CONFIG.BLENDED_RATE_PER_HOUR
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ label: '', pct: 0 });

  const filteredData = filterRecords(rawData, filters);
  const aggregatedData = aggregateData(filteredData);
  const insights = generateInsights(aggregatedData, filteredData, CONFIG);
  const filterOptions = extractFilterOptions(rawData);

  const loadFiles = useCallback(async (files, append = false) => {
    setLoading(true);
    let baseData = append ? rawData : [];
    let newFiles = append ? [...loadedFiles] : [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({
          label: files.length > 1 ? `File ${i + 1} of ${files.length}: ${file.name}` : file.name,
          pct: 0
        });
        const text = await file.text();
        const records = await parseNDJSON(text, {
          onProgress: pct => setProgress(prev => ({ ...prev, pct }))
        });
        baseData = [...baseData, ...records];
        newFiles = [...newFiles, { name: file.name, records: records.length }];
      }

      const merged = mergeRecords(baseData);
      const allDates = merged.map(r => r.day).sort();
      setRawData(merged);
      setLoadedFiles(newFiles);
      setFilters({
        dateFrom: allDates[0] || null,
        dateTo: allDates[allDates.length - 1] || null,
        user: null, ide: null, language: null
      });
    } catch (err) {
      alert('Error parsing file: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [rawData, loadedFiles]);

  const resetData = useCallback(() => {
    setRawData([]);
    setLoadedFiles([]);
    setFilters({ dateFrom: null, dateTo: null, user: null, ide: null, language: null });
    setLoading(false);
  }, []);

  return {
    rawData, loadedFiles, filteredData, aggregatedData, insights,
    filters, setFilters, filterOptions, valueConfig, setValueConfig,
    loading, progress, loadFiles, resetData
  };
}
