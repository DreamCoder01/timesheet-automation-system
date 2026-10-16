# Architectural Blueprint: Timesheet Automation System

This document outlines the complete, production-grade directory and file blueprint for the application. The system is designed as a **Monorepo Workspace** containing a **Python FastAPI backend** built on Clean Architecture principles and a **Next.js frontend** optimized for fast, predictable UI rendering.

---

## Dependency Direction & Core Architectural Rules

1. **Inward-Pointing Dependency Rule:**
   The layers inside the backend follow a strict inward-pointing path. Modules inside `/domain` or `/use_cases` are forbidden from importing files from `/adapters` or `/infrastructure`. They remain pure Python logic, insulated from database engines or API frameworks.
2. **The Database Decoupling Principle:**
   `/adapters/repository/interfaces.py` specifies Abstract Base Classes (interfaces) for data persistence. The use cases interact exclusively with these abstractions. If you migrate from **SQLite** to **PostgreSQL**, the underlying calculation engines remain entirely untouched.
3. **Frontend Separation of Concerns & Containerized Proxies:**
   Application state is handled globally within the parent view page controller (`page.tsx`) and the transport client utility (`apiService.ts`). Component testing follows the **Colocation Principle**; test modules live inside a local `__tests__` folder directly next to the implementation. When containerized, the Next.js rewrite engine replaces relative routes with the internal Docker domain `BACKEND_PROXY_URL=http://backend:8000` to prevent localhost collision failures.

---

## System Directory Tree Blueprint

```text
/timesheet-automation-system
│
├── README.md                           # Global system setup, environment definitions, and unified run scripts
├── .gitignore                          # Master version control exclusion configurations (blocks .db and .coverage)
├── docker-compose.yml                  # Local orchestration running separate frontend and backend container blocks
│
├── /backend                            # Python FastAPI Backend Services
│   ├── main.py                         # Application entrypoint; bootstraps frameworks and runs ASGI server
│   ├── requirements.txt                # Fixed pinning for FastAPI, Pandas, SQLAlchemy, Pydantic, httpx, coverage
│   ├── Dockerfile                      # slim-python environment definition compiling pinned dependencies
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
│   │   │       ├── interfaces.py       # Abstract Base Classes for ValidatedShiftModel and AnomalyExceptionModel
│   │   │       └── sql_repository.py   # Concrete implementation of interfaces mapped to Timesheet and Anomaly tables
│   │   │
│   │   └── /infrastructure             # LAYER 1: Frameworks & Drivers (The external boundary shell)
│   │       ├── __init__.py
│   │       │
│   │       ├── /api                    # FastAPI Presentation Routing Endpoints
│   │       │   ├── __init__.py
│   │       │   ├── deps.py             # Dependency Injection definitions (e.g., Database sessions)
│   │       │   ├── schemas.py          # Pydantic explicit Response contracts (e.g., ValidatedShiftResponse)
│   │       │   └── v1_endpoints.py     # REST endpoints returning GlobalDashboardPayloadResponse packages
│   │       │
│   │       └── /database               # Relational Database Connections
│   │           ├── __init__.py
│   │           ├── base.py             # SQLAlchemy Declarative Base definitions for relational models
│   │           ├── database.py         # Engine configuration, pooling setups, and local session initializers
│   │           └── schemas_db.py       # Relational database table schemas (Timesheet and Anomaly tables)
│   │
│   └── /tests                          # Backend Testing Harness (Mirrors Production App Layout)
│       ├── __init__.py
│       ├── /domain
│       │   └── test_exceptions.py      # Isolate verification for domain exceptions
│       ├── /adapters
│       │   ├── __init__.py
│       │   ├── /csv
│       │   │   └── test_pandas_processor.py # Stream buffer parsing boundary tests
│       │   └── /repository
│       │       ├── __init__.py
│       │       └── test_sql_repository.py   # RAM-isolated in-memory SQLite database and abstract base interface tests
│       └── /infrastructure
│           ├── __init__.py
│           └── /api
│               └── test_v1_endpoints.py     # TestClient network payload serialization and break deduction tests
│
└── /frontend                           # Next.js Frontend Web Application
    ├── package.json                    # Dependencies, scripts, and security overrides (Vitest, Happy DOM, PostCSS)
    ├── tsconfig.json                   # TypeScript compiling parameters and module alias definitions (@/*)
    ├── react-app-env.d.ts              # Global TypeScript asset typings declaration authorising CSS maps
    ├── next.config.js                  # Proxy configuration with dynamic environmental BACKEND_PROXY_URL hooks
    ├── postcss.config.js               # PostCSS compilation configuration hooking in @tailwindcss/postcss
    ├── tailwind.config.js              # UI styling rules, color schemes (amber/neutral overrides matching design)
    ├── vitest.config.ts                # Test runner configuration (SWC compiler binding, happy-dom environment, 80% thresholds)
    ├── vitest.setup.ts                 # Global test environment configuration (mocks next/navigation, stubs window.alert)
    ├── Dockerfile                      # slim-node environment container using npm ci cache hydration loops
    │
    └── /src                            # Monorepo Frontend Flat Source Architecture
        ├── /components                 # Presentational UI Components with Colocated Test Modules
        │   ├── FileUploader.tsx        # Drag-and-drop file ingestion boundary wrapper
        │   ├── MetricsGrid.tsx         # Renders the horizontal metric KPI summary blocks
        │   ├── TimesheetTable.tsx      # Renders clean employee totals and decimal breakdowns
        │   ├── AnomaliesAlert.tsx      # Interactive box rendering quarantined error logs
        │   └── /__tests__              # Presentational Unit Test Suites
        │       ├── AnomaliesAlert.test.tsx # Verifies conditional status layout structures and data arrays
        │       ├── FileUploader.test.tsx   # Simulates browser File blob changes and drag-and-drop event cycles
        │       ├── MetricsGrid.test.tsx    # Evaluates standard number strings and zero fallback branches
        │       └── TimesheetTable.test.tsx # Validates table cell rendering and regex formatting lookups
        │
        ├── /models                     # TypeScript structural interfaces matching backend Response contracts
        │   ├── validatedShiftInterface.ts    # Maps ValidatedShiftResponse structures
        │   └── anomalyExceptionInterface.ts  # Maps AnomalyExceptionResponse and IGlobalDashboardPayload structures
        │
        ├── /services                   # HTTP Client Network Layer
        │   ├── apiService.ts           # Singleton instance managing fetch transactions, backend proxies, and error logging
        │   └── /__tests__
        │       └── apiService.test.ts  # Intercepts global fetch streams to verify network transactions and error trapping
        │
        └── /app                        # Next.js App Router Tree Architecture (Dedicated strictly to routing shells)
            ├── globals.css             # Unified Tailwind CSS directive entrypoint file
            ├── layout.tsx              # Global HTML document context wrapper mounting styles and viewports
            ├── page.tsx                # Primary Dashboard base controller orchestrating state changes
            └── /__tests__
                └── page.test.tsx       # Integration suite verifying initialization states in concurrent hydration trees
```
