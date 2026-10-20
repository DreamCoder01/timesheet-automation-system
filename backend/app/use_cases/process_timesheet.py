import uuid
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any
from app.domain.models import (
    ValidatedShiftModel, AnomalyExceptionModel, ShiftStatus, 
    AnomalyCategory, ErrorSeverity, InferredContext
)
from app.use_cases.heuristic_parser import HeuristicTimestampParser
from app.use_cases.time_accumulator import TimeAccumulator
from app.use_cases.deduplicator import IdempotencyDeduplicator
from app.domain.models import RawInputPayload

class ProcessTimesheetPipeline:
    """Master workflow engine orchestrating raw CSV inputs into sanitized structural states."""

    def __init__(self):
        self.parser = HeuristicTimestampParser()
        self.accumulator = TimeAccumulator()
        self.deduplicator = IdempotencyDeduplicator()

    def execute(self, indexed_payloads: List[Tuple[int, RawInputPayload]]) -> Dict[str, Any]:
        valid_shifts: List[ValidatedShiftModel] = []
        quarantined_anomalies: List[AnomalyExceptionModel] = []

        fallback_week_date = "2026-09-07"

        for line_num, payload in indexed_payloads:
            # 1. Intercept Structural Omissions and Missing Column Shapes (Lines 23 & 24)
            if not payload.employee_id or not payload.clock_in or not payload.clock_out:
                msg = f"Missing vital structural identifier keys at line {line_num}."
                if not payload.employee_id:
                    msg = f"Structural Mismatch: Missing mandatory Employee ID field reference at line {line_num}."
                elif not payload.clock_out:
                    msg = f"Structural Mismatch: Employee forgot to clock out or columns are truncated at line {line_num}."
                
                quarantined_anomalies.append(AnomalyExceptionModel(
                    exception_id=str(uuid.uuid4()),
                    quarantine_timestamp=datetime.now(timezone.utc),
                    error_severity=ErrorSeverity.CRITICAL,
                    error_category=AnomalyCategory.STRUCTURAL_MISMATCH,
                    diagnostic_message=msg,
                    raw_input_line_number=line_num,
                    raw_input_payload=payload,
                    inferred_context=InferredContext()
                ))
                continue

            # 2. Intercept Duplicate Line Entries (Lines 6 and 7 duplication cases)
            if self.deduplicator.is_duplicate(payload):
                quarantined_anomalies.append(AnomalyExceptionModel(
                    exception_id=str(uuid.uuid4()),
                    quarantine_timestamp=datetime.now(timezone.utc),
                    error_severity=ErrorSeverity.WARNING,
                    error_category=AnomalyCategory.DUPLICATE_LOG,
                    diagnostic_message=f"Identical duplicate data log signature caught at row line {line_num}.",
                    raw_input_line_number=line_num,
                    raw_input_payload=payload,
                    inferred_context=InferredContext()
                ))
                continue

            # 3. Execute Chronological & Mathematical Processing
            try:
                parsed_in = self.parser.parse_timestamp(payload.clock_in, fallback_week_date)
                parsed_out = self.parser.parse_timestamp(payload.clock_out, fallback_week_date)

                # Edge-case: Catch Same-Time zero minute double tap anomalies (Line 21)
                if parsed_in == parsed_out:
                    raise ValueError("Same-Time log paradox registered. Employee accidental terminal double-tap.")

                # Edge-case: Catch Inverted Chronological Time-Clock Entries (Line 15)
                if parsed_out < parsed_in:
                    raise ValueError(f"Inverted chronological time clock log detected: clock-out ({payload.clock_out}) cannot be earlier than clock-in ({payload.clock_in}).")

                raw_m, payable_m, overnight_flag = self.accumulator.calculate_durations(parsed_in, parsed_out)

                valid_shifts.append(ValidatedShiftModel(
                    entry_id=str(uuid.uuid4()),
                    employee_id=payload.employee_id,
                    employee_full_name=payload.employee_name or "Unknown Employee",
                    department_id="Default cost center",
                    shift_date=parsed_in.strftime("%Y-%m-%d"),
                    clock_in_raw=parsed_in,
                    clock_out_raw=parsed_out,
                    is_overnight=overnight_flag,
                    break_duration_minutes=30 if raw_m > 360 else 0,
                    total_raw_minutes=raw_m,
                    total_payable_minutes=payable_m,
                    status=ShiftStatus.COMPLETE
                ))

            except Exception as e:
                quarantined_anomalies.append(AnomalyExceptionModel(
                    exception_id=str(uuid.uuid4()),
                    quarantine_timestamp=datetime.now(timezone.utc),
                    error_severity=ErrorSeverity.WARNING,
                    error_category=AnomalyCategory.LOGICAL_PARADOX,
                    diagnostic_message=str(e),
                    raw_input_line_number=line_num,
                    raw_input_payload=payload,
                    inferred_context=InferredContext()
                ))

        return {
            "valid_shifts": valid_shifts,
            "anomalies": quarantined_anomalies
        }
