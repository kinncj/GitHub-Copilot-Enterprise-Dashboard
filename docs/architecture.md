# Architecture

## Layers

The codebase follows Clean Architecture. Domain logic is pure JavaScript with no DOM dependencies. The presentation layer is React components that read from a central hook and pass data down as props.

```mermaid
graph TD
    subgraph Presentation["app/presentation/"]
        CTX[context/AppContext.jsx]
        COMP[components/**/*.jsx]
        CHARTS[charts/*.jsx]
    end

    subgraph State["app/state/"]
        HOOK[useAppState.js]
    end

    subgraph Domain["app/domain/"]
        D1[config/constants.js]
        D2[data/parser.js]
        D3[data/merger.js]
        D4[data/aggregator.js]
        D5[filtering/engine.js]
        D6[insights/engine.js]
        D7[export/csv.js]
        D8[export/ndjson.js]
    end

    subgraph Common["common/"]
        C1[utils/format.js]
        C2[utils/download.js]
        C3[types/index.js]
    end

    COMP --> CTX
    CHARTS --> CTX
    CTX --> HOOK
    HOOK --> Domain
    Domain --> Common
```

Domain modules have **no imports from `app/state/` or `app/presentation/`**. They receive data as arguments and return values — this is what makes them testable in Node without a browser.

---

## Data Flow

```mermaid
flowchart LR
    A[User drops .ndjson file] --> B["parseNDJSON\nchunked, 10k lines/batch"]
    B --> C["normalizeRecord\ncoerce types, drop invalids"]
    C --> D["mergeRecords\nMath.max on overlapping exports"]
    D --> E["useAppState.js\nrawData state"]

    E --> F["filterRecords\ndate · user · IDE · language"]
    F --> G["aggregateData\nbyUser · byDay · byIDE · byLanguage · byFeature · byModel"]

    G --> H1["KpiSection"]
    G --> H2["14 chart components"]
    G --> H3["generateInsights → InsightsPanel"]
    G --> H4["DataTable"]
```

Files are parsed once and stored in `rawData`. Every filter change re-runs `filterRecords → aggregateData → render`. No caching — the single-pass aggregation is fast enough for the dataset sizes involved.

---

## React Component Tree

```mermaid
graph TD
    main["app/main.jsx"] --> App["App.jsx"]
    App --> CTX["AppContext.Provider\n(useAppState)"]
    CTX --> Upload["UploadZone"]
    CTX --> Progress["ProgressBar"]
    CTX --> Dashboard["Dashboard"]

    Dashboard --> Header
    Dashboard --> FilterBar
    Dashboard --> KpiSection
    Dashboard --> MetricsGlossary
    Dashboard --> ValueConfig
    Dashboard --> Charts["14 chart components"]
    Dashboard --> InsightsPanel
    Dashboard --> DataTable
```

`App` renders one of three top-level views based on state: `UploadZone` (no data), `ProgressBar` (loading), or `Dashboard` (data loaded).

---

## State Shape

```mermaid
classDiagram
    class useAppState {
        CopilotRecord[] rawData
        LoadedFile[] loadedFiles
        FilterCriteria filters
        ValueConfig valueConfig
        boolean loading
        Progress progress
        CopilotRecord[] filteredData
        AggregatedData aggregatedData
        Insight[] insights
        FilterOptions filterOptions
    }

    class CopilotRecord {
        string user_login
        string day
        number code_generation_activity_count
        number code_acceptance_activity_count
        number loc_added_sum
        number loc_deleted_sum
        number active_time_minutes
        IdeEntry[] totals_by_ide
        FeatureEntry[] totals_by_feature
        LanguageFeatureEntry[] totals_by_language_feature
        LanguageModelEntry[] totals_by_language_model
        ModelFeatureEntry[] totals_by_model_feature
    }

    class AggregatedData {
        Object byUser
        Object byDay
        Object byIDE
        Object byLanguage
        Object byFeature
        Object byModel
    }

    class FilterCriteria {
        string|null dateFrom
        string|null dateTo
        string|null user
        string|null ide
        string|null language
    }

    useAppState --> CopilotRecord
    useAppState --> AggregatedData
    useAppState --> FilterCriteria
```

`filteredData`, `aggregatedData`, `insights`, and `filterOptions` are derived synchronously from `rawData` + `filters` on every render — no separate dispatch step.

---

## NDJSON Schema

The real GitHub Copilot Enterprise export format (as of late 2025):

```json
{
  "report_start_day": "2025-11-19",
  "report_end_day": "2025-12-16",
  "day": "2025-12-07",
  "enterprise_id": "5429",
  "user_id": 12345678,
  "user_login": "octocat",
  "user_initiated_interaction_count": 40,
  "code_generation_activity_count": 101,
  "code_acceptance_activity_count": 4,
  "loc_suggested_to_add_sum": 617,
  "loc_suggested_to_delete_sum": 0,
  "loc_added_sum": 2452,
  "loc_deleted_sum": 93,
  "used_agent": true,
  "used_chat": true,
  "totals_by_ide": [...],
  "totals_by_feature": [...],
  "totals_by_language_feature": [...],
  "totals_by_language_model": [...],
  "totals_by_model_feature": [...]
}
```

**Field notes:**
- `loc_suggested_to_add_sum` — lines Copilot suggested (ghost text shown)
- `loc_added_sum` — lines actually accepted/applied (what landed in the file)
- `active_time_minutes` — not present in current API exports; parser defaults to 0
- `model` — not a root-level field; model info is in `totals_by_language_model` and `totals_by_model_feature`
- `user_initiated_interaction_count` — user-triggered chat/agent interactions (not passive completions)

---

## SOLID in Practice

| Principle | Where it shows up |
|-----------|-------------------|
| **Single Responsibility** | Each module has one job: `parser.js` parses, `merger.js` merges, `aggregator.js` aggregates. None of them render or touch the DOM. |
| **Open/Closed** | New insight: add a block to `insights/engine.js`, no existing code changes. New chart: add a JSX component under `presentation/charts/`. |
| **Liskov** | Not directly applicable (no inheritance). Composition used throughout. |
| **Interface Segregation** | Domain functions take only the data slice they need — `filterRecords(records, criteria)` doesn't receive the whole state. |
| **Dependency Inversion** | Domain modules depend on `common/utils/format.js`, not on browser APIs. The React layer wires the browser into the domain by passing callbacks (`onProgress`). |
