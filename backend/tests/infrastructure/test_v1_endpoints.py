import unittest
from io import BytesIO
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from main import app
from app.infrastructure.database.database import Base, get_db
from app.infrastructure.database.schemas_db import Timesheet, Anomaly

class TestV1EndpointsIntegration(unittest.TestCase):

    def setUp(self):
        """Initializes a fresh transactional in-memory database engine for total isolation 
        across async worker threads using shared cache configurations.
        """
        self.engine = create_engine(
            "sqlite:///:memory:?cache=shared",
            poolclass=StaticPool,
            connect_args={"check_same_thread": False}
        )
        
        Base.metadata.create_all(bind=self.engine)
        self.TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Override the FastAPI engine dependency mapping on initialization
        def override_get_db():
            db = self.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()
                
        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app, raise_server_exceptions=True)

    def tearDown(self):
        """Wipes table records and tears down overridden dependencies cleanly."""
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_health_check_telemetry_returns_200_status(self):
        """Confirms live systems endpoint status returns online parameters."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "online", "timestamp": "active"})

    def test_historical_dashboard_endpoint_loads_successfully(self):
        """Verifies GET /dashboard loads current database storage snapshots cleanly."""
        response = self.client.get("/api/v1/timesheets/dashboard")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("healthy_data_pool", data)
        self.assertIn("unhealthy_data_pool", data)
        self.assertIn("total_rows_skipped", data)

    def test_upload_endpoint_accepts_valid_csv_stream_buffer(self):
        """Verifies file ingestion workflows calculate and persist payroll floats."""
        csv_content = (
            b"employee_id,employee_name,clock_in,clock_out,till_id\n"
            b"E006,Tom Wallace,2026-09-07 06:00,2026-09-07 14:00,T1\n"
        )
        file_payload = {
            "file": ("sample_week.csv", BytesIO(csv_content), "text/csv")
        }

        response = self.client.post("/api/v1/timesheets/upload", files=file_payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["total_employees"], 1)
        self.assertEqual(data["total_shifts_counted"], 1)
        self.assertEqual(data["total_rows_skipped"], 0)
        
        # Fixed: Updated assertions to match the true 7:30 / 7.5 post-break calculation output
        first_shift = data["healthy_data_pool"][0]
        self.assertEqual(first_shift["hours_display"], "7:30")
        self.assertEqual(first_shift["decimal_hours"], 7.5)

    def test_upload_endpoint_handles_empty_csv_anomaly_isolation_and_reconciliation_lifecycles(self):
        """Verifies data paradox fields trigger quarantine containment models 
        and exercises initial plus sequential duplicate reconciliation route handlers.
        """
        bad_csv = b"employee_id,employee_name,clock_in,clock_out,till_id\n,Missing User,09:00,17:00,T1\n"
        file_payload = {"file": ("corrupt.csv", BytesIO(bad_csv), "text/csv")}

        response = self.client.post("/api/v1/timesheets/upload", files=file_payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["total_shifts_counted"], 0)
        self.assertEqual(data["total_rows_skipped"], 1)
        
        first_anomaly = data["unhealthy_data_pool"][0]
        self.assertEqual(first_anomaly["error_category"], "Structural_Mismatch")
        
        generated_exception_id = first_anomaly["exception_id"]
        
        # ----------------------------------------------------
        # Action Loop: Execute PATCH Reconcile Flow 
        # ----------------------------------------------------
        correction_payload = {
            "employee_id": "E100", 
            "clock_in": "2026-09-07 09:00", 
            "clock_out": "2026-09-07 17:00"
        }
        reconcile_response = self.client.patch(
            f"/api/v1/timesheets/reconcile/{generated_exception_id}", 
            json=correction_payload
        )
        self.assertEqual(reconcile_response.status_code, 200)
        
        reconcile_data = reconcile_response.json()
        self.assertEqual(reconcile_data["status"], "Success")
        self.assertEqual(reconcile_data["exception_id"], generated_exception_id)

    def test_reconcile_endpoint_returns_404_if_exception_id_missing(self):
        """Ensures transmitting an unmapped anomaly code raises a 404 Exception."""
        response = self.client.patch("/api/v1/timesheets/reconcile/non-existent-uuid-12345", json={})
        self.assertEqual(response.status_code, 404)
        self.assertIn("could not be located", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
