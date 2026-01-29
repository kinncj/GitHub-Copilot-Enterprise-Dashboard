# Architecture

This document describes the system architecture, design patterns, and data flow of the GitHub Copilot Enterprise Dashboard.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Performance Architecture](#performance-architecture)
- [Chart Architecture](#chart-architecture)

## High-Level Architecture

The dashboard follows a **single-file, zero-dependency architecture** optimized for enterprise deployment.

```mermaid
graph TB
    subgraph "Browser Environment"
        A[index.html] --> B[HTML Structure]
        A --> C[Embedded CSS]
        A --> D[Embedded JavaScript]

        subgraph "External Dependencies (CDN)"
            E[Tailwind CSS]
            F[Chart.js v4]
            G[Lucide Icons]
        end

        B --> H[Dashboard UI]
        C --> H
        D --> I[Application Logic]
        E --> H
        F --> I
        G --> H

        subgraph "Application Core"
            I --> J[Parser Module]
            I --> K[Aggregation Module]
            I --> L[Filter Module]
            I --> M[Rendering Module]
            I --> N[Insights Engine]
        end

        O[User NDJSON File] --> J
        J --> K
        K --> L
        L --> M
        L --> N
        M --> H
        N --> H
    end

    style A fill:#4f46e5,stroke:#333,stroke-width:3px,color:#fff
    style I fill:#10b981,stroke:#333,stroke-width:2px
    style H fill:#6366f1,stroke:#333,stroke-width:2px
```

### Key Architectural Principles

1. **Zero Build Process** - Direct browser execution, no compilation needed
2. **No Backend Required** - 100% client-side processing for data privacy
3. **CDN Dependencies** - External libraries loaded from CDN for simplicity
4. **Monolithic Structure** - Single file for easy deployment and version control
5. **Responsive Design** - Works on desktop, tablet, and mobile devices

## Data Flow

### Complete Data Processing Pipeline

```mermaid
flowchart TD
    Start([User Action]) --> Upload{Upload Method}
    Upload -->|Drag & Drop| FileInput[File Input]
    Upload -->|Click Button| FileInput

    FileInput --> Validate{Validate File}
    Validate -->|Invalid Format| Error1[Show Error Message]
    Validate -->|Valid NDJSON| Parse[Chunked Parser]

    Parse --> ParseLoop{Process Chunk}
    ParseLoop -->|10k lines| ValidateChunk{Validate Records}
    ValidateChunk -->|Invalid Record| Skip[Skip Record + Log Warning]
    ValidateChunk -->|Valid Record| Store[Store in rawData]
    Skip --> ParseLoop
    Store --> ParseLoop
    ParseLoop -->|More Chunks| ParseLoop
    ParseLoop -->|Complete| Aggregate[Aggregate Data]

    Aggregate --> AggTypes[/"Aggregate by:
    - User
    - Day
    - IDE
    - Language
    - Feature
    - Model"/]

    AggTypes --> InitFilters[Initialize Filters]
    InitFilters --> ApplyFilters[Apply Filters]

    ApplyFilters --> RenderPipeline{Parallel Rendering}
    RenderPipeline --> KPI[Render KPIs]
    RenderPipeline --> Charts[Render Charts]
    RenderPipeline --> Insights[Generate Insights]
    RenderPipeline --> Table[Render Data Table]

    KPI --> Display[Display Dashboard]
    Charts --> Display
    Insights --> Display
    Table --> Display

    Display --> UserInteraction{User Interaction}
    UserInteraction -->|Filter Change| ApplyFilters
    UserInteraction -->|Sort Table| SortData[Sort Data]
    UserInteraction -->|Export CSV| Export[Generate CSV]
    UserInteraction -->|Upload New File| Start

    SortData --> Table
    Export --> Download[Download File]

    Error1 --> End([End])
    Download --> End

    style Parse fill:#10b981,stroke:#333,stroke-width:2px
    style Aggregate fill:#6366f1,stroke:#333,stroke-width:2px
    style RenderPipeline fill:#f59e0b,stroke:#333,stroke-width:2px
    style Display fill:#4f46e5,stroke:#333,stroke-width:2px,color:#fff
```

### Chunked Parsing Strategy

Large files are processed in chunks to prevent UI freezing:

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Parser
    participant State
    participant Renderer

    User->>UI: Upload 100MB NDJSON
    UI->>Parser: Start parseNDJSON()

    Note over Parser: Split into 10k line chunks

    loop For each chunk
        Parser->>Parser: Process 10k lines
        Parser->>State: Store valid records
        Parser->>UI: Update progress bar
        Parser->>Parser: setTimeout(0) yield to browser
    end

    Parser->>State: Mark parsing complete
    Parser->>Renderer: Trigger aggregation
    Renderer->>State: Aggregate data
    Renderer->>UI: Render dashboard
    UI->>User: Show analytics
```

## Component Architecture

### Module Organization

```mermaid
graph LR
    subgraph "Core Modules"
        A[State Manager] --> B[Parser]
        A --> C[Aggregator]
        A --> D[Filter Engine]
        A --> E[Renderer]
    end

    subgraph "Rendering Components"
        E --> F[KPI Cards]
        E --> G[Chart Renderer]
        E --> H[Insights Engine]
        E --> I[Data Table]
    end

    subgraph "Chart Types"
        G --> J[Activity Timeline]
        G --> K[Acceptance Trends]
        G --> L[User Rankings]
        G --> M[Distribution Charts]
        G --> N[Efficiency Matrix]
    end

    subgraph "Utilities"
        O[Formatters]
        P[Date Helpers]
        Q[Chart Options]
        R[Export Functions]
    end

    F --> O
    G --> O
    G --> P
    G --> Q
    H --> O
    I --> O
    I --> R

    style A fill:#4f46e5,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#333,stroke-width:2px
```

### Component Responsibilities

| Component | Responsibility | Key Functions |
|-----------|---------------|---------------|
| **Parser** | NDJSON parsing, validation | `parseNDJSON()`, `validateRecord()` |
| **Aggregator** | Data aggregation, rollups | `aggregateData()`, `computeMetrics()` |
| **Filter Engine** | Apply user filters | `applyFilters()`, `updateFilterUI()` |
| **Renderer** | Coordinate all rendering | `renderDashboard()`, `renderCharts()` |
| **KPI Cards** | Metric summaries | `renderKPIs()`, `calculateKPI()` |
| **Chart Renderer** | Visualization creation | `renderActivityChart()`, `renderTopUsers()` |
| **Insights Engine** | Anomaly detection | `generateInsights()`, `detectPowerUsers()` |
| **Data Table** | Tabular display | `renderDataTable()`, `sortTable()` |

## State Management

### Global State Structure

```mermaid
classDiagram
    class State {
        +Object rawData
        +Object filteredData
        +Object aggregatedData
        +Object charts
        +Object filters
        +String sortColumn
        +String sortDirection
        +Boolean isLoading
    }

    class RawData {
        +Array records
        +Date minDate
        +Date maxDate
        +Array users
        +Object metadata
    }

    class AggregatedData {
        +Object byUser
        +Object byDay
        +Object byIDE
        +Object byLanguage
        +Object byFeature
        +Object byModel
        +Object totals
    }

    class Filters {
        +Date startDate
        +Date endDate
        +Array selectedUsers
        +Array selectedIDEs
        +Array selectedLanguages
    }

    class Charts {
        +Chart activityTimeline
        +Chart acceptanceRate
        +Chart topUsers
        +Chart ideShare
        +Chart languages
        +Chart features
        +Chart efficiency
        +Chart model
    }

    State --> RawData
    State --> AggregatedData
    State --> Filters
    State --> Charts
```

### State Update Flow

```mermaid
stateDiagram-v2
    [*] --> Initial: Page Load
    Initial --> Loading: File Upload
    Loading --> Parsing: Validate File
    Parsing --> Aggregating: Parse Complete
    Aggregating --> Filtering: Aggregation Complete
    Filtering --> Rendered: Apply Filters

    Rendered --> Filtering: User Changes Filter
    Rendered --> Sorting: User Sorts Table
    Rendered --> Exporting: User Exports CSV
    Rendered --> Loading: User Uploads New File

    Sorting --> Rendered: Sort Complete
    Exporting --> Rendered: Export Complete

    Parsing --> Error: Invalid Data
    Error --> Initial: Reset
```

## Performance Architecture

### Optimization Strategies

```mermaid
graph TB
    subgraph "Performance Optimizations"
        A[Large File Handling] --> A1[Chunked Parsing<br/>10k lines/batch]
        A --> A2[Non-blocking with setTimeout]
        A --> A3[Progress Feedback]

        B[Rendering Performance] --> B1[Single-pass Aggregation]
        B --> B2[Virtual Table Scrolling<br/>500 row limit]
        B --> B3[Chart Instance Reuse]

        C[Memory Management] --> C1[Chart Cleanup on Filter]
        C --> C2[Destroy/Recreate Pattern]
        C --> C3[Limited Data Retention]

        D[User Experience] --> D1[Optimistic UI Updates]
        D --> D2[Loading States]
        D --> D3[Error Boundaries]
    end

    style A fill:#10b981,stroke:#333,stroke-width:2px
    style B fill:#6366f1,stroke:#333,stroke-width:2px
    style C fill:#f59e0b,stroke:#333,stroke-width:2px
    style D fill:#4f46e5,stroke:#333,stroke-width:2px,color:#fff
```

### Performance Metrics

| Operation | Target | Strategy |
|-----------|--------|----------|
| **Parse 100MB file** | < 10s | Chunked processing (10k lines) |
| **Filter change** | < 500ms | Pre-aggregated data |
| **Chart render** | < 300ms | Optimized Chart.js config |
| **Table sort** | < 100ms | In-memory sort, limited rows |
| **CSV export** | < 2s | Blob API, async processing |

## Chart Architecture

### Chart Rendering Pipeline

```mermaid
flowchart LR
    Start[Filter Change] --> Destroy{Destroy Existing Charts}
    Destroy --> Prepare[Prepare Chart Data]

    Prepare --> Timeline[Activity Timeline]
    Prepare --> Acceptance[Acceptance Rate]
    Prepare --> Users[Top Users]
    Prepare --> IDE[IDE Distribution]
    Prepare --> Lang[Languages]
    Prepare --> Features[Feature Usage]
    Prepare --> Matrix[Efficiency Matrix]
    Prepare --> Model[Model Usage]

    Timeline --> Config1[Apply Chart Options]
    Acceptance --> Config2[Apply Chart Options]
    Users --> Config3[Apply Chart Options]
    IDE --> Config4[Apply Chart Options]
    Lang --> Config5[Apply Chart Options]
    Features --> Config6[Apply Chart Options]
    Matrix --> Config7[Apply Chart Options]
    Model --> Config8[Apply Chart Options]

    Config1 --> Create1[Create Chart Instance]
    Config2 --> Create2[Create Chart Instance]
    Config3 --> Create3[Create Chart Instance]
    Config4 --> Create4[Create Chart Instance]
    Config5 --> Create5[Create Chart Instance]
    Config6 --> Create6[Create Chart Instance]
    Config7 --> Create7[Create Chart Instance]
    Config8 --> Create8[Create Chart Instance]

    Create1 --> Store[Store in state.charts]
    Create2 --> Store
    Create3 --> Store
    Create4 --> Store
    Create5 --> Store
    Create6 --> Store
    Create7 --> Store
    Create8 --> Store

    Store --> Display[Display Charts]

    style Destroy fill:#ef4444,stroke:#333,stroke-width:2px
    style Display fill:#10b981,stroke:#333,stroke-width:2px
```

### Chart Type Overview

```mermaid
graph TB
    subgraph "Time-based Charts"
        A1[Activity Timeline<br/>Line Chart]
        A2[Acceptance Rate Trend<br/>Area Chart]
    end

    subgraph "Ranking Charts"
        B1[Top Users by Generations<br/>Horizontal Bar]
        B2[Top Users by Acceptance<br/>Horizontal Bar]
    end

    subgraph "Distribution Charts"
        C1[IDE Market Share<br/>Doughnut]
        C2[Language Distribution<br/>Doughnut]
        C3[Model Distribution<br/>Pie]
    end

    subgraph "Usage Charts"
        D1[Feature Usage<br/>Bar Chart]
    end

    subgraph "Analysis Charts"
        E1[User Efficiency Matrix<br/>Scatter Plot]
    end

    style A1 fill:#6366f1,stroke:#333,stroke-width:2px
    style A2 fill:#6366f1,stroke:#333,stroke-width:2px
    style B1 fill:#10b981,stroke:#333,stroke-width:2px
    style B2 fill:#10b981,stroke:#333,stroke-width:2px
    style C1 fill:#f59e0b,stroke:#333,stroke-width:2px
    style C2 fill:#f59e0b,stroke:#333,stroke-width:2px
    style C3 fill:#f59e0b,stroke:#333,stroke-width:2px
    style D1 fill:#3b82f6,stroke:#333,stroke-width:2px
    style E1 fill:#4f46e5,stroke:#333,stroke-width:2px,color:#fff
```

## Extension Points

The architecture supports extensibility through well-defined interfaces:

```mermaid
graph LR
    subgraph "Extension Points"
        A[New Data Sources] --> A1[Parser Extension]
        B[New Aggregations] --> B1[Aggregator Extension]
        C[New Charts] --> C1[Renderer Extension]
        D[New Insights] --> D1[Engine Extension]
        E[Persistence] --> E1[Storage Extension]
    end

    A1 -.-> F[parseNDJSON function]
    B1 -.-> G[aggregateData function]
    C1 -.-> H[renderCharts function]
    D1 -.-> I[generateInsights function]
    E1 -.-> J[localStorage API]

    style A fill:#10b981,stroke:#333,stroke-width:2px
    style B fill:#6366f1,stroke:#333,stroke-width:2px
    style C fill:#f59e0b,stroke:#333,stroke-width:2px
    style D fill:#3b82f6,stroke:#333,stroke-width:2px
    style E fill:#4f46e5,stroke:#333,stroke-width:2px,color:#fff
```

See [Development Guide](./development.md) for detailed extension instructions.

## Security Considerations

```mermaid
graph TB
    A[Security Model] --> B[Client-Side Only Processing]
    A --> C[No Data Transmission]
    A --> D[No External APIs]
    A --> E[File Validation]

    B --> B1[All data stays in browser]
    C --> C1[No network requests after load]
    D --> D1[CDN dependencies only]
    E --> E1[NDJSON format validation]
    E --> E2[Record schema validation]

    style A fill:#4f46e5,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#10b981,stroke:#333,stroke-width:2px
    style C fill:#10b981,stroke:#333,stroke-width:2px
    style D fill:#10b981,stroke:#333,stroke-width:2px
    style E fill:#f59e0b,stroke:#333,stroke-width:2px
```

## Next Steps

- **[Data Schema](./data-schema.md)** - Understand the NDJSON data structure
- **[Configuration](./configuration.md)** - Customize thresholds and settings
- **[Development Guide](./development.md)** - Start building extensions
