# Architecture

## Layers

The codebase follows Clean Architecture: domain logic is pure JavaScript with no DOM dependencies; the presentation layer is a thin shell that reads from the state store and calls domain functions.

```mermaid
graph TD
    subgraph Presentation["app/presentation/"]
        P1[components/kpi.js]
        P2[components/table.js]
        P3[components/insights.js]
        P4[charts/]
    end

    subgraph State["app/state/"]
        S[store.js]
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

    Presentation --> State
    Presentation --> Domain
    Domain --> Common
    State -.->|"reads slice"| Domain
```

Domain modules have **no imports from `app/state/` or `app/presentation/`**. They receive data as arguments and return values — this is what makes them testable in Node without a browser.

---

## Data Flow

```mermaid
flowchart LR
    A[User drops .ndjson file] --> B[parseNDJSON\nchunked, 10k lines/batch]
    B --> C[normalizeRecord\ncoerce types, drop invalids]
    C --> D[mergeRecords\nMath.max on overlapping exports]
    D --> E[app/state/store.js\nrawData]

    E --> F[filterRecords\ndate · user · IDE · language]
    F --> G[aggregateData\nbyUser · byDay · byIDE · byLanguage · byFeature · byModel]

    G --> H1[renderKPIs]
    G --> H2[renderCharts × 14]
    G --> H3[generateInsights → renderInsights]
    G --> H4[renderTable]
```

Files go through the parser once. Every filter change re-runs `filterRecords → aggregateData → render`. No caching layer — the single-pass aggregation is fast enough for the dataset sizes involved.

---

## Module Map

```mermaid
graph LR
    main["app/main.js"] --> store["app/state/store.js"]
    main --> parser["app/domain/data/parser.js"]
    main --> merger["app/domain/data/merger.js"]
    main --> filter["app/domain/filtering/engine.js"]
    main --> agg["app/domain/data/aggregator.js"]
    main --> ins["app/domain/insights/engine.js"]
    main --> kpi["app/presentation/components/kpi.js"]
    main --> charts["app/presentation/charts/"]
    main --> table["app/presentation/components/table.js"]

    parser --> constants["app/domain/config/constants.js"]
    merger --> constants
    filter --> constants
    agg --> constants
    ins --> constants
    ins --> format["common/utils/format.js"]

    kpi --> store
    charts --> store
    table --> store

    csvExport["app/domain/export/csv.js"] --> format
    ndjsonExport["app/domain/export/ndjson.js"]
    download["common/utils/download.js"]
```

---

## State Shape

```mermaid
classDiagram
    class State {
        CopilotRecord[] rawData
        LoadedFile[] loadedFiles
        CopilotRecord[] filteredData
        AggregatedData aggregatedData
        Map~string,Chart~ charts
        FilterCriteria filters
        string|null sortColumn
        string sortDirection
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
        string model
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

    State --> CopilotRecord
    State --> AggregatedData
    State --> FilterCriteria
```

---

## SOLID in Practice

| Principle | Where it shows up |
|-----------|-------------------|
| **Single Responsibility** | Each module has one job: `parser.js` parses, `merger.js` merges, `aggregator.js` aggregates. None of them render or touch the DOM. |
| **Open/Closed** | New insight types: add a function to `insights/engine.js`, no existing code changes. New chart: add a module under `presentation/charts/`, register it. |
| **Liskov** | Not directly applicable (no inheritance hierarchy). Composition used instead. |
| **Interface Segregation** | Domain functions take only the data slice they need — `filterRecords(records, criteria)` doesn't receive the whole state. |
| **Dependency Inversion** | Domain modules depend on `common/utils/format.js` (abstraction), not on browser APIs. The presentation layer wires the browser into the domain by passing callbacks (e.g. `onProgress`). |
