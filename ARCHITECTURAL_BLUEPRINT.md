# Architectural Blueprint: Timesheet Automation System

This document outlines the complete, production-grade directory and file blueprint for the application. The system is designed as a **Monorepo Workspace** containing a **Python FastAPI backend** built on Clean Architecture principles and a **Next.js frontend** optimized for fast, predictable UI rendering.

---

## Dependency Direction & Core Architectural Rules

1. **Inward-Pointing Dependency Rule:**
   The layers inside the backend follow a strict inward-pointing path. Modules inside `/domain` or `/use_cases` are forbidden from importing files from `/adapters` or `/infrastructure`. They remain pure Python logic, insulated from database engines or API frameworks.
2. **The Database Decoupling Principle:**
   `/adapters/repository/interfaces.py` specifies Abstract Base Classes (interfaces) for data persistence. The use cases interact exclusively with these abstractions. If you migrate from **SQLite** to **PostgreSQL**, the underlying calculation engines remain entirely untouched.
3. **Frontend Separation of Concerns:**
   Application state is handled globally within the parent view page controller (`page.tsx`) and the transport client utility (`apiService.ts`). Shared UI components reside outside the routing directory inside `/src/components` and act as presentational nodes that ingest properties and emit functional event triggers, preventing state fragmentation.

---

## System Directory Tree Blueprint

```text
/timesheet-automation-system
│
├── README.md                           # Global system setup, environment definitions, and unified run scripts
├── .gitignore                          # Master version control exclusion configurations (blocks .db and .coverage)
├── docker-compose.yml                  # Local development orchestration (Containers for frontend and backend boundaries)
│
├── /backend                            # Python FastAPI Backend Services
│   ├── main.py                         # Application entrypoint; bootstraps frameworks and runs ASGI server
│   ├── requirements.txt                # Fixed pinning for FastAPI, Pandas, SQLAlchemy, Pydantic, httpx, coverage
│   ├── .env.example                    # Template for database paths, environment flags, and CORS configurations
│   │
│   ├── /app
│   │   ├── __init__.py
│   │   │
│   │   ├── /domain                     # LAYER 4: Enterprise Business Entities (Zero external dependencies)
│   │   │   ├── __init__.py
│   │   │   ├── models.py               # Pure structures: ValidatedShiftModel and AnomalyExceptionModel
│   │   │   └── exceptions.py           # Domain-specific custom errors (e.g., UnparseableFileException)
│   │   │
│   │   ├── /use_cases                  # LAYER 3: Application Business Rules (Orchestrates Domain Entities)
│   │   │   ├── __init__.py
│   │   │   ├── process_timesheet.py    # Master pipeline workflow orchestrator (Ingest -> Validate -> Tally -> Persist)
│   │   │   ├── heuristic_parser.py     # Cascading date-time interpreter engine for legacy formats
│   │   │   ├── time_accumulator.py     # Base-60 minutes aggregator and payroll decimal calculator
│   │   │   └── deduplicator.py         # Implements cryptographic hashing layer to intercept identical raw records
│   │   │
│   │   ├── /adapters                   # LAYER 2: Interface Adapters (Bridges Core Logic to External Drivers)
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── /csv                    # CSV parsing translation layer
│   │   │   │   ├── __init__.py
│   │   │   │   └── pandas_processor.py # Reads raw stream buffer via Pandas; handles trailing whitespaces
│   │   │   │
│   │   │   └── /repository             # Data persistence contracts and mappings
│   │   │       ├── __init__.py
│   │   │       ├── interfaces.py       # Abstract Base Classes for Timesheet and Anomaly data access
│   │   │       └── sql_repository.py   # Concrete implementation of interfaces using SQLAlchemy mapping tools
│   │   │
│   │   └── /infrastructure             # LAYER 1: Frameworks & Drivers (The external boundary shell)
│   │       ├── __init__.py
│   │       │
│   │       ├── /api                    # FastAPI Presentation Routing Endpoints
│   │       │   ├── __init__.py
│   │       │   ├── deps.py             # Dependency Injection definitions (e.g., Database sessions)
│   │       │   ├── schemas.py          # Pydantic explicit Response contracts (e.g., ValidatedShiftResponse)
│   │       │   └── v1_endpoints.py     # REST endpoints parsing payloads and returning response contracts
│   │       │
│   │       └── /database               # Relational Database Connections
│   │           ├── __init__.py
│   │           ├── base.py             # SQLAlchemy Declarative Base definitions for relational models
│   │           ├── database.py         # Engine configuration, pooling setups, and local session initializers
│   │           └── schemas_db.py       # Relational database table schemas (Timesheet and Anomaly tables)
│   │
│   └── /tests                          # Complete Testing Harness (Mirrors Production App Layout Directories)
│       ├── __init__.py
│       ├── /domain
│       │   └── test_exceptions.py      # Isolate verification for domain exceptions
│       ├── /adapters
│       │   ├── /csv
│       │   │   └── test_pandas_processor.py # Stream buffer parsing boundary tests
│       │   └── /repository
│       │       └── test_sql_repository.py   # Ephemeral RAM-isolated in-memory SQLite database tests
│       └── /infrastructure
│           └── /api
│               └── test_v1_endpoints.py     # High-concurrency TestClient network payload serialization tests
│
└── /frontend                           # Next.js Frontend Web Application
    ├── package.json                    # Component library dependencies, Tailwind configurations, Next.js setups
    ├── tailwind.config.js              # UI styling rules, color schemes (amber/neutral overrides matching design)
    ├── postcss.config.js               # PostCSS compilation configuration hooking in @tailwindcss/postcss
    ├── tsconfig.json                   # TypeScript compiling parameters and module alias definitions (@/*)
    ├── react-app-env.d.ts              # Global TypeScript asset typings declaration authorising .css module maps
    ├── next.config.js                  # Optimization configurations and backend proxy API path redirects
    │
    └── /src                            # Monorepo Frontend Flat Source Architecture
        ├── /components                 # Pure Presentational UI Components
        │   ├── FileUploader.tsx        # Drag-and-drop file ingestion boundary wrapper
        │   ├── MetricsGrid.tsx         # Renders the horizontal metric KPI summary blocks
        │   ├── TimesheetTable.tsx      # Renders clean employee totals and decimal breakdowns
        │   └── AnomaliesAlert.tsx      # Interactive box rendering quarantined error logs for operator review
        │
        ├── /models                     # TypeScript structural interfaces matching the explicit Backend Responses
        │   ├── validatedShiftInterface.ts    # Maps ValidatedShiftResponse structures
        │   └── anomalyExceptionInterface.ts  # Maps AnomalyExceptionResponse structures
        │
        ├── /services                   # HTTP Client Network Layer
        │   └── apiService.ts           # Fetch client abstraction managing backend API proxies and exception trapping
        │
        └── /app                        # Next.js App Router Tree Architecture (Dedicated strictly to routing shells)
            ├── globals.css             # Unified Tailwind CSS v4 directive entrypoint file
            ├── layout.tsx              # Global HTML document context wrapper mounting styles and viewport configurations
            └── page.tsx                # Primary Dashboard Base View Controller orchestrating presentation states
```
