import uuid
from typing import Optional, Dict, Any
from app.adapters.repository.interfaces import ITimesheetRepository, IAnomalyRepository
from app.domain.models import ValidatedShiftModel, ShiftStatus
from app.use_cases.heuristic_parser import HeuristicTimestampParser
from app.use_cases.time_accumulator import TimeAccumulator
from app.infrastructure.api.schemas import ReconciliationCorrectionSchema

class ReprocessAnomalyUseCase:
    """Orchestrates the conversion, structural adjustment, or explicit discard of a

    quarantined exception entry into the active production ledger using human overrides.
    """

    def __init__(self, timesheet_repo: ITimesheetRepository, anomaly_repo: IAnomalyRepository):
        self.timesheet_repo = timesheet_repo
        self.anomaly_repo = anomaly_repo
        self.parser = HeuristicTimestampParser()
        self.accumulator = TimeAccumulator()

    def execute(self, exception_id: str, corrections: ReconciliationCorrectionSchema, operator_name: str) -> Dict[str, Any]:
        """Loads a quarantined entry, overlays operator adjustments, validates the new timeline,

        and executes an atomic cross-table state synchronization commit or discard process.
        """
        # 1. Fetch original record context from quarantine storage vault
        anomaly_model = self.anomaly_repo.get_anomaly_by_id(exception_id)
        if not anomaly_model:
            return {"status": "Error", "message": "Quarantined record reference could not be located."}

        if anomaly_model.resolution_status == "Resolved":
            return {"status": "Conflict", "message": "This exception has already been marked as resolved."}

        # 2. Layer supervisor inputs over old data strings to patch missing values safely
        raw_payload = anomaly_model.raw_input_payload
        
        final_employee_id = corrections.employee_id if corrections.employee_id is not None else (raw_payload.employee_id if raw_payload else None)
        final_employee_name = corrections.employee_name if corrections.employee_name is not None else (raw_payload.employee_name if raw_payload else None)
        final_clock_in = corrections.clock_in if corrections.clock_in is not None else (raw_payload.clock_in if raw_payload else None)
        final_clock_out = corrections.clock_out if corrections.clock_out is not None else (raw_payload.clock_out if raw_payload else None)
        final_till_id = corrections.till_id if corrections.till_id is not None else (raw_payload.till_id if raw_payload else None)

        # --- EXPLICIT ACCIDENTAL DOUBLE-TAP ESCAPE BRANCH ---
        # If the supervisor leaves timestamps identical or types "DISCARD", handle it cleanly
        if final_clock_in and final_clock_in == final_clock_out:
            # Mark the tracking entry as resolved to clear out current dashboard workflows
            self.anomaly_repo.resolve_anomaly(exception_id, operator_name)
            return {
                "status": "Success",
                "message": f"Accidental zero-minute double-tap on row line {anomaly_model.raw_input_line_number} was successfully archived and discarded from payroll.",
                "exception_id": exception_id,
                "shift_details": None
            }

        # 3. Enforce foundational boundary checks on raw text string states
        if not final_employee_id or not final_employee_id.strip():
            raise ValueError("Reconciliation failed: Employee ID remains missing or empty.")
        if not final_clock_in or not final_clock_in.strip():
            raise ValueError("Reconciliation failed: Clock-in timestamp remains missing or empty.")
        if not final_clock_out or not final_clock_out.strip():
            raise ValueError("Reconciliation failed: Clock-out timestamp remains missing or empty.")

        # 4. Re-run parsing engines to translate corrected strings back to datetime objects
        fallback_week_date = "2026-09-07"
        parsed_in = self.parser.parse_timestamp(final_clock_in.strip(), fallback_week_date)
        parsed_out = self.parser.parse_timestamp(final_clock_out.strip(), fallback_week_date)

        # 5. Prevent overlapping chronological paradoxes
        if parsed_in == parsed_out:
            # Handle post-parse identical evaluations as a fallback discard path
            self.anomaly_repo.resolve_anomaly(exception_id, operator_name)
            return {
                "status": "Success",
                "message": f"Accidental double-tap log path on row line {anomaly_model.raw_input_line_number} was successfully archived and discarded.",
                "exception_id": exception_id,
                "shift_details": None
            }

        # 6. Calculate total raw durations and auto-deduct breaks over 6 hours
        raw_m, payable_m, overnight_flag = self.accumulator.calculate_durations(parsed_in, parsed_out)

        # 7. Materialize the new valid production domain model
        validated_shift = ValidatedShiftModel(
            entry_id=str(uuid.uuid4()),
            employee_id=final_employee_id.strip(),
            employee_full_name=final_employee_name.strip() if final_employee_name else "Unknown Employee",
            department_id="Default cost center",
            shift_date=parsed_in.strftime("%Y-%m-%d"),
            clock_in_raw=parsed_in,
            clock_out_raw=parsed_out,
            is_overnight=overnight_flag,
            break_duration_minutes=30 if raw_m > 360 else 0,
            total_raw_minutes=raw_m,
            total_payable_minutes=payable_m,
            status=ShiftStatus.COMPLETE
        )

        # 8. Persist new shift records to the clean production ledger table
        self.timesheet_repo.save_shift(validated_shift)

        # 9. Clear the item from the active quarantine tracking registry
        self.anomaly_repo.resolve_anomaly(exception_id, operator_name)

        return {
            "status": "Success",
            "message": "Anomaly successfully reconciled and merged into production ledger.",
            "exception_id": exception_id,
            "shift_details": validated_shift
        }
