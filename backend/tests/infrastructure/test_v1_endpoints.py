import unittest
from io import BytesIO
from fastapi.testclient import TestClient
from main import app

class TestV1EndpointsIntegration(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health_check_telemetry_returns_200_status(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "online", "timestamp": "active"})

    def test_upload_endpoint_accepts_valid_csv_stream_buffer(self):
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
        
        first_shift = data["healthy_data_pool"][0]
        self.assertEqual(first_shift["hours_display"], "7:30")
        self.assertEqual(first_shift["decimal_hours"], 7.5)

    def test_upload_endpoint_handles_empty_csv_anomaly_isolation(self):
        bad_csv = b"employee_id,employee_name,clock_in,clock_out,till_id\n,Missing User,09:00,17:00,T1\n"
        file_payload = {"file": ("corrupt.csv", BytesIO(bad_csv), "text/csv")}

        response = self.client.post("/api/v1/timesheets/upload", files=file_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_shifts_counted"], 0)
        self.assertEqual(data["total_rows_skipped"], 1)
        
        first_anomaly = data["unhealthy_data_pool"][0]
        self.assertEqual(first_anomaly["error_category"], "Structural_Mismatch")

if __name__ == "__main__":
    unittest.main()
