import uvicorn
import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.infrastructure.database.database import engine, Base
from app.infrastructure.api.v1_endpoints import router as timesheet_router

def bootstrap_application() -> FastAPI:
    """Configures system infrastructure boundaries, generates relational tables, 

    binds application routers, and injects middleware contracts.
    """
    # 1. Automatically spin up and map local SQL database structures on application startup
    Base.metadata.create_all(bind=engine)

    # 2. Initialize Core FastAPI presentation engine instance
    app = FastAPI(
        title="Timesheet Normalization Automation Engine",
        description="Enterprise Clean Architecture backend handling multi-format legacy timesheet normalization workflows.",
        version="1.0.0"
    )

    # 3. Inject Cross-Origin Resource Sharing (CORS) Middleware Security Guardrails
    # This explicit rule authorizes your Next.js application layer to query API payloads securely
    raw_origins = os.getenv("ALLOWED_ORIGINS", '["http://localhost:3000"]')
    try:
        origins = json.loads(raw_origins)
    except Exception:
        origins = ["http://localhost:3000"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 4. Bind our Production V1 API Module Routers
    app.include_router(timesheet_router)

    @app.get("/health", tags=["System Health Monitoring"])
    def check_health_telemetry():
        """Lightweight live health telemetry endpoint checking network availability."""
        return {
            "status": "online",
            "timestamp": "active"
        }

    return app

# Instantiate our application layer instance
app = bootstrap_application()

if __name__ == "__main__":
    # Pull system bindings out of environmental variables or default cleanly to port 8000
    target_host = os.getenv("HOST", "0.0.0.0")
    target_port = int(os.getenv("PORT", 8000))
    
    # Initialize ASGI process serving our API surface boundary loop
    uvicorn.run(
        "main:app", 
        host=target_host, 
        port=target_port, 
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )
