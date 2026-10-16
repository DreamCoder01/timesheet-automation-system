# Timesheet Automation & Payroll Reconciliation System

A production-grade, full-stack monorepo application engineered to automate the ingestion, normalization, and auditing of fragmented legacy till system timesheet reports. Built following strict **Clean Architecture** conventions, the platform enforces an inward-pointing dependency path and fully decouples core application business logic from framework drivers, databases, and user interface boundaries.

---

## 🚀 Quick Start Core Run Scripts

From the repository root directory, you can orchestrate both subsystems simultaneously using our unified runtime blocks:

```bash
# 1. Full Environment Bootstrapper (Build and initialize both boundaries)
git clone https://github.com
cd timesheet-automation-system

# 2. Fire Up Local Infrastructure Containers Natively
# Spawns isolated backend and frontend blocks linked via dynamic domain network bridges
docker compose up --build
```

---

## 🛠️ Subsystem Matrix & Toolchain Blueprints

| Subsystem Component  | Layer Focus                            | Core Stack Platform        | Key Packages & Tooling                                 | Performance Metrics                                |
| :------------------- | :------------------------------------- | :------------------------- | :----------------------------------------------------- | :------------------------------------------------- |
| **Backend API Core** | Domain Logic, Parsers, DB Repositories | `Python 3.13`              | FastAPI, Pandas, SQLAlchemy, Pydantic v2, Uvicorn      | **93% Total Coverage** (Strict 80% per-file floor) |
| **Frontend Web App** | Presentational Layout, HTTP Clients    | `Next.js 15+` / `React 19` | TSX, Tailwind CSS v4, Lucide Icons, TypeScript         | **94% Total Coverage** (Strict 80% per-file floor) |
| **Testing Harness**  | Ephemeral RAM Mocks, Assertions        | `Unittest` & `Vitest 4`    | `coverage.py`, `happy-dom`, `@vitejs/plugin-react-swc` | **0 Critical Security Vulnerabilities**            |

---

## 📊 Comprehensive Verification & Coverage Protocols

Both horizons enforce strict quality gate controls. To execute the automated testing validation harnesses and verify your line coverage thresholds locally, run the following command groups:

### 🐍 Backend Pipeline Verification (Python 3.13)

Step into your backend directory and trigger your isolated in-memory testing matrix tracks:

```bash
cd backend
# Run all 21 automated use-case, endpoint, and repository tests
coverage run -m unittest discover -s tests -p "test_*.py"

# Compile and print your line-by-line coverage metrics matrix
coverage report
```

### ⚛️ Frontend Pipeline Verification (Next.js 15 / React 19)

Step into your frontend folder root boundary and execute the Rust-based SWC compilation testing runner:

```bash
cd frontend
# Runs all 17 colocated presentational and transport layer integration tests
npm run test:coverage
```

---

## 🔒 Security Compliance & Override Posture

The workspace is protected against supply-chain exploits and remote code execution (RCE) vectors via explicit sub-dependency pinned overrides configured inside the frontend manifest (`package.json`).

Instead of performing destructive framework upgrades that clash with React 19 concurrent hydration states, the project locks down these safe sub-dependency patches globally:

- **`vitest@4.1.11` & `tinypool@2.1.2`:** Patches prototype pollution and hot-module-reload local path traversal vulnerabilities.
- **`happy-dom@20.8.9`:** Closes critical VM context escape holes to protect local testing runners and CI automation containers.
- **`postcss@8.5.23`:** Extinguishes unescaped style-tag cross-site scripting (XSS) and arbitrary local file map lookups.

---

## 🗺️ Shared Monorepo Architectural Directory Layout

```text
/timesheet-automation-system
│
├── ARCHITECTURAL_BLUEPRINT.md      # System source-of-truth configuration mappings and rules
├── docker-compose.yml              # Local environment development engine container setups
│
├── /backend                        # LAYERED PYTHON APPLICATION ROOT
│   ├── main.py                     # FastAPI infrastructure bootstrapper and application registry
│   ├── requirements.txt            # Absolute environment dependency tracking sheets
│   ├── Dockerfile                  # Python 3.13 configuration layer container script
│   ├── /app
│   │   ├── /domain                 # Enterprise Business Models (ValidatedShiftModel, AnomalyExceptionModel)
│   │   ├── /use_cases              # Business Operations (HeuristicParser, TimeAccumulator, Deduplicator)
│   │   ├── /adapters               # Boundary Translators (PandasCSVProcessor, SQLTimesheetRepository)
│   │   └── /infrastructure         # Framework Drivers (v1_endpoints routing, database schema sheets)
│   └── /tests                      # Independent Python validation harness tree mirror
│
└── /frontend                       # COLOCATED NEXT.JS FLAT-SOURCE FLAT APPLICATION ROOT
    ├── vitest.config.ts            # Configures custom Happy DOM runtimes and V8 80% coverage ceilings
    ├── vitest.setup.ts             # Stubs browser window alerts and mocks next/navigation router hooks
    ├── Dockerfile                  # Node 20 environment layout container script
    └── /src
        ├── /components             # Pure UI modules containing internal colocated /__tests__/ subfolders
        ├── /models                 # TypeScript interfaces matching backend response payload contracts
        ├── /services               # apiService singleton client executing isolated fetch streams
        └── /app                    # Next.js App Router tree handling style entrypoints and root shells
```

---

## 📜 Business Rules & Payroll Compliance Core

When timesheet rows pass through the system use cases, they are audited against two non-negotiable operational boundary conditions:

1.  **Automated Unpaid Break Deduction Rules:**
    Any continuous shift entry spanning greater than **6.0 hours (360 minutes)** triggers an automated **30-minute unpaid deduction**. For example, a clock-in of `06:00` and clock-out of `14:00` yields a gross time card of 8 hours, which is automatically saved as exactly **7.5 payable decimal hours (`7:30`)**.
2.  **Cryptographic Idempotency Guard rails:**
    To block double-payment errors caused by identical till system row duplications, each row generates a cryptographic payload signature hash. Duplicate entries are quarantined as a `DUPLICATE_LOG` warning exception, leaving your production records clean.
