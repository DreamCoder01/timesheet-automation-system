# Architectural Blueprint: Timesheet Automation System

This document outlines the complete, production-grade directory and file blueprint for the application. The system is designed as a **Monorepo Workspace** containing a **Python FastAPI backend** built on Clean Architecture principles and a **Next.js frontend** optimized for fast, predictable UI rendering.

---

## Dependency Direction & Core Architectural Rules

1. **Inward-Pointing Dependency Rule:**
   The layers inside the backend follow a strict inward-pointing path. Modules inside `/domain` or `/use_cases` are forbidden from importing files from `/adapters` or `/infrastructure`. They remain pure Python logic, insulated from database engines or API frameworks.
2. **The Database Decoupling Principle:**
   `/adapters/repository/interfaces.py` specifies Abstract Base Classes (interfaces) for data persistence. The use cases interact exclusively with these abstractions. If you migrate from **SQLite** to **PostgreSQL**, the underlying calculation engines remain entirely untouched.
3. **Frontend Separation of Concerns:**
   Application state is handled globally within the parent controller (`page.tsx`) and the abstraction layer (`api.service.ts`). Files inside the `/components` folder function as pure presentational nodes that take data properties and emit events, preventing state fragmentation.

---

## System Directory Tree Blueprint

```text
/timesheet-app
│
├── README.md                           # Global system setup, environment definitions, and unified run scripts
├── docker-compose.yml                  # Local development orchestration (Containers for frontend and backend boundaries)
│
├── /backend                            # Python FastAPI Backend Services
│   ├── main.py                         # Application entrypoint; bootstraps frameworks and runs ASGI server
│   ├── requirements.txt                # Fixed pinning for FastAPI, Pandas, Uvicorn, SQLAlchemy, Pydantic
│   ├── .env.example                    # Template for database paths, environment flags, and CORS configurations
│   │
│   └── /app
│       ├── __init__.py
│       │
│       ├── /domain                     # LAYER 4: Enterprise Business Entities (Zero external dependencies)
│       │   ├── __init__.py
│       │   ├── models.py               # Pure structures: MasterModel data class and AnomalyException data class
│       │   └── exceptions.py           # Domain-specific custom errors (e.g., UnparseableFileException)
│       │
│       ├── /use_cases                  # LAYER 3: Application Business Rules (Orchestrates Domain Entities)
│       │   ├── __init__.py
│       │   ├── process_timesheet.py    # Master pipeline workflow orchestrator (Ingest -> Validate -> Tally -> Persist)
│       │   ├── heuristic_parser.py     # Cascading date-time interpreter engine for legacy formats
│       │   ├── time_accumulator.py     # Base-60 minutes aggregator and payroll decimal calculator
│       │   └── deduplicator.py         # Implements cryptographic hashing layer to intercept identical raw records
│       │
│       ├── /adapters                   # LAYER 2: Interface Adapters (Bridges Core Logic to External Drivers)
│       │   ├── __init__.py
│       │   │
│       │   ├── /csv                    # CSV parsing translation layer
│       │   │   ├── __init__.py
│       │   │   └── pandas_processor.py # Reads raw stream buffer via Pandas; handles column width checks and text formatting
│       │   │
│       │   └── /repository             # Data persistence contracts and mappings
│       │       ├── __init__.py
│       │       ├── interfaces.py       # Abstract Base Classes (Interfaces) for Timesheet and Anomaly data access
│       │       └── sql_repository.py   # Concrete implementation of interfaces using SQLAlchemy mapping tools
│       │
│       └── /infrastructure             # LAYER 1: Frameworks & Drivers (The external boundary shell)
│           ├── __init__.py
│           │
│           ├── /api                    # FastAPI Presentation Routing Endpoints
│           │   ├── __init__.py
│           │   ├── deps.py             # Dependency Injection definitions (e.g., Database sessions, Service instances)
│           │   ├── schemas.py          # Pydantic Request/Response validation payloads for client transmission
│           │   └── v1_endpoints.py     # REST endpoints (e.g., POST /api/v1/timesheets/upload, GET /api/v1/dashboard)
│           │
│           └── /database               # Relational Database Connections
│               ├── __init__.py
│               ├── base.py             # SQLAlchemy Declarative Base definitions for relational models
│               ├── database.py         # Engine configuration, pooling setups, and local session initializers
│               └── schemas_db.py       # SQL relational tables mapped directly to SQLite primitives
│
└── /frontend                           # Next.js Frontend Web Application
    ├── package.json                    # Component library dependencies, Tailwind configurations, Next.js setups
    ├── tailwind.config.js              # UI styling rules, color schemes (amber/neutral overrides matching design)
    ├── tsconfig.json                   # TypeScript compiling parameters and module alias definitions
    ├── next.config.js                  # Optimization configurations and backend proxy API path redirects
    │
    └── /src
        └── /app                        # Next.js App Router Architecture
            ├── layout.tsx              # Global document context, baseline font setups, and metadata anchors
            ├── page.tsx                # Dashboard Base Controller; orchestrates dashboard UI states and file uploads
            │
            ├── /models                 # TypeScript structural interfaces matching the Backend JSON response payloads
            │   ├── master.interface.ts # Maps valid employee total hour entries
            │   └── anomaly.interface.ts# Maps skipped entries and error details for administrative remediation
            │
            ├── /services               # HTTP Client Layer
            │   └── api.service.ts      # Fetch client abstraction managing API payloads and exception trapping
            │
            └── /components             # Highly Modularized Pure Presentational UI Components
                ├── FileUploader.tsx    # Drag-and-drop boundary providing file schema hints and execution controls
                ├── MetricsGrid.tsx     # Renders the 4 horizontal metric KPI summary blocks (Team, Shifts, Skipped Rows)
                ├── TimesheetTable.tsx  # Display grid rendering clean valid employee totals and decimal breakdowns
                └── AnomaliesAlert.tsx  # Interactive amber alert box rendering quarantined error logs for Sam's review
```
