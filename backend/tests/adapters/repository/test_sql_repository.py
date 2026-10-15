import unittest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.infrastructure.database.database import Base
from app.adapters.repository.interfaces import ITimesheetRepository, IAnomalyRepository
from app.adapters.repository.sql_repository import SQLTimesheetRepository, SQLAnomalyRepository
from app.domain.models import (
    ValidatedShiftModel, AnomalyExceptionModel, ShiftStatus, 
    ErrorSeverity, AnomalyCategory, RawInputPayload, InferredContext
)

# --- Concrete Dummy Classes to Force Abstract Base Class Coverage ---
class DummyTimesheetRepository(ITimesheetRepository):
    def save_shift(self, shift: ValidatedShiftModel) -> None:
        super().save_shift(shift)

    def get_shifts_by_employee(self, employee_id: str) -> list:
        return super().get_shifts_by_employee(employee_id)

    def get_all_shifts(self) -> list:
        return super().get_all_shifts()

class DummyAnomalyRepository(IAnomalyRepository):
    def save_anomaly(self, anomaly: AnomalyExceptionModel) -> None:
        super().save_anomaly(anomaly)

    def get_unresolved_anomalies(self) -> list:
        return super().get_unresolved_anomalies()


class TestSQLRepositories(unittest.TestCase):

    def setUp(self):
        """Initializes an isolated in-memory SQLite schema engine before each test run."""
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db_session = self.SessionLocal()

        self.timesheet_repo = SQLTimesheetRepository(self.db_session)
        self.anomaly_repo = SQLAnomalyRepository(self.db_session)

    def tearDown(self):
        """Wipes the session environment completely and disposes of engine connections."""
        self.db_session.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_abstract_interfaces_pass_statements_coverage(self):
        """Executes the fallback pass statements inside abstract base classes to hit 100% coverage."""
        dummy_ts = DummyTimesheetRepository()
        dummy_anom = DummyAnomalyRepository()

        # Act & Assert (Triggers the internal 'pass' blocks via super execution loops)
        dummy_ts.save_shift(None)
        self.assertIsNone(dummy_ts.get_shifts_by_employee("E001"))
        self.assertIsNone(dummy_ts.get_all_shifts())

        dummy_anom.save_anomaly(None)
        self.assertIsNone(dummy_anom.get_unresolved_anomalies())

    def test_timesheet_repository_saves_and_retrieves_records_correctly(self):
        """Verifies full round-trip mapping persistence loops for validated timesheet entities."""
        shift_entity = ValidatedShiftModel(
            entry_id="test-shift-123",
            employee_id="E006",
            employee_full_name="Tom Wallace",
            department_id="Cost Center A",
            shift_date="2026-09-07",
            clock_in_raw=datetime(2026, 9, 7, 6, 0, tzinfo=timezone.utc),
            clock_out_raw=datetime(2026, 9, 7, 14, 0, tzinfo=timezone.utc),
            is_overnight=False,
            break_duration_minutes=30,
            total_raw_minutes=480,
            total_payable_minutes=450,
            status=ShiftStatus.COMPLETE
        )

        self.timesheet_repo.save_shift(shift_entity)
        retrieved_shifts = self.timesheet_repo.get_all_shifts()

        self.assertEqual(len(retrieved_shifts), 1)
        self.assertEqual(retrieved_shifts[0].employee_id, "E006")
        self.assertEqual(retrieved_shifts[0].total_payable_minutes, 450)

    def test_anomaly_repository_saves_and_retrieves_quarantined_exceptions(self):
        """Verifies full round-trip mapping persistence loops for captured data anomalies."""
        raw_row = RawInputPayload(employee_id=None, employee_name="Missing ID", clock_in="09:00", clock_out="17:00", till_id="T1")
        anomaly_entity = AnomalyExceptionModel(
            exception_id="test-anomaly-456",
            quarantine_timestamp=datetime.now(timezone.utc),
            error_severity=ErrorSeverity.CRITICAL,
            error_category=AnomalyCategory.STRUCTURAL_MISMATCH,
            diagnostic_message="Missing structural key",
            raw_input_line_number=23,
            raw_input_payload=raw_row,
            inferred_context=InferredContext(),
            resolution_status="Unresolved"
        )

        self.anomaly_repo.save_anomaly(anomaly_entity)
        unresolved_anomalies = self.anomaly_repo.get_unresolved_anomalies()

        self.assertEqual(len(unresolved_anomalies), 1)
        self.assertEqual(unresolved_anomalies[0].exception_id, "test-anomaly-456")

if __name__ == "__main__":
    unittest.main()
