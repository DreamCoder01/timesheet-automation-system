from typing import List
from sqlalchemy.orm import Session
from app.adapters.repository.interfaces import ITimesheetRepository, IAnomalyRepository
from app.domain.models import ValidatedShiftModel, AnomalyExceptionModel
from app.infrastructure.database.schemas_db import Timesheet, Anomaly

class SQLTimesheetRepository(ITimesheetRepository):
    """Concrete SQL implementation of the Timesheet storage contract."""

    def __init__(self, db_session: Session):
        self.db = db_session

    def save_shift(self, shift: ValidatedShiftModel) -> None:
        """Translates and persists a valid domain shift object into a database row."""
        db_entry = Timesheet(
            entry_id=shift.entry_id,
            employee_id=shift.employee_id,
            employee_full_name=shift.employee_full_name,
            department_id=shift.department_id,
            shift_date=shift.shift_date,
            clock_in_raw=shift.clock_in_raw,
            clock_out_raw=shift.clock_out_raw,
            is_overnight=shift.is_overnight,
            break_duration_minutes=shift.break_duration_minutes,
            total_raw_minutes=shift.total_raw_minutes,
            total_payable_minutes=shift.total_payable_minutes,
            status=shift.status.value if hasattr(shift.status, 'value') else str(shift.status)
        )
        self.db.add(db_entry)
        self.db.commit()

    def get_shifts_by_employee(self, employee_id: str) -> List[ValidatedShiftModel]:
        """Queries and materializes valid shift domain objects for a specific employee."""
        rows = self.db.query(Timesheet).filter(Timesheet.employee_id == employee_id).all()
        from app.domain.models import ShiftStatus
        return [
            ValidatedShiftModel(
                entry_id=row.entry_id,
                employee_id=row.employee_id,
                employee_full_name=row.employee_full_name,
                department_id=row.department_id,
                shift_date=row.shift_date,
                clock_in_raw=row.clock_in_raw,
                clock_out_raw=row.clock_out_raw,
                is_overnight=row.is_overnight,
                break_duration_minutes=row.break_duration_minutes,
                total_raw_minutes=row.total_raw_minutes,
                total_payable_minutes=row.total_payable_minutes,
                status=ShiftStatus(row.status) if hasattr(ShiftStatus, 'value') else ShiftStatus.COMPLETE
            ) for row in rows
        ]

    def get_all_shifts(self) -> List[ValidatedShiftModel]:
        """Queries and handles full round-trip lists of all verified shifts within database layers."""
        rows = self.db.query(Timesheet).all()
        from app.domain.models import ShiftStatus
        return [
            ValidatedShiftModel(
                entry_id=row.entry_id,
                employee_id=row.employee_id,
                employee_full_name=row.employee_full_name,
                department_id=row.department_id,
                shift_date=row.shift_date,
                clock_in_raw=row.clock_in_raw,
                clock_out_raw=row.clock_out_raw,
                is_overnight=row.is_overnight,
                break_duration_minutes=row.break_duration_minutes,
                total_raw_minutes=row.total_raw_minutes,
                total_payable_minutes=row.total_payable_minutes,
                status=ShiftStatus(row.status) if hasattr(ShiftStatus, 'value') else ShiftStatus.COMPLETE
            ) for row in rows
        ]


class SQLAnomalyRepository(IAnomalyRepository):
    """Concrete SQL implementation of the Anomaly containment contract."""

    def __init__(self, db_session: Session):
        self.db = db_session

    def save_anomaly(self, anomaly: AnomalyExceptionModel) -> None:
        """Maps and writes quarantined processing exception parameters to relational fields."""
        db_entry = Anomaly(
            exception_id=anomaly.exception_id,
            quarantine_timestamp=anomaly.quarantine_timestamp,
            error_severity=anomaly.error_severity.value if hasattr(anomaly.error_severity, 'value') else str(anomaly.error_severity),
            error_category=anomaly.error_category.value if hasattr(anomaly.error_category, 'value') else str(anomaly.error_category),
            diagnostic_message=anomaly.diagnostic_message,
            raw_input_line_number=anomaly.raw_input_line_number,
            raw_employee_id=anomaly.raw_input_payload.employee_id if anomaly.raw_input_payload else None,
            raw_employee_name=anomaly.raw_input_payload.employee_name if anomaly.raw_input_payload else None,
            raw_clock_in=anomaly.raw_input_payload.clock_in if anomaly.raw_input_payload else None,
            raw_clock_out=anomaly.raw_input_payload.clock_out if anomaly.raw_input_payload else None,
            raw_till_id=anomaly.raw_input_payload.till_id if anomaly.raw_input_payload else None,
            resolution_status=anomaly.resolution_status if hasattr(anomaly.resolution_status, 'value') else str(anomaly.resolution_status)
        )
        self.db.add(db_entry)
        self.db.commit()

    def get_unresolved_anomalies(self) -> List[AnomalyExceptionModel]:
        """Returns full data arrays of outstanding quarantined processing exceptions."""
        rows = self.db.query(Anomaly).all()
        from app.domain.models import AnomalyCategory, ErrorSeverity, RawInputPayload, InferredContext
        return [
            AnomalyExceptionModel(
                exception_id=row.exception_id,
                quarantine_timestamp=row.quarantine_timestamp,
                error_severity=ErrorSeverity(row.error_severity) if hasattr(ErrorSeverity, 'value') else ErrorSeverity.CRITICAL,
                error_category=AnomalyCategory(row.error_category) if hasattr(AnomalyCategory, 'value') else AnomalyCategory.STRUCTURAL_MISMATCH,
                diagnostic_message=row.diagnostic_message,
                raw_input_line_number=row.raw_input_line_number,
                raw_input_payload=RawInputPayload(row.raw_employee_id, row.raw_employee_name, row.raw_clock_in, row.raw_clock_out, row.raw_till_id),
                inferred_context=InferredContext(),
                resolution_status=row.resolution_status # <-- Direct mapping preserves database string states safely
            ) for row in rows
        ]
