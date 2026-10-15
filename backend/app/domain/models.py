from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from enum import Enum

class ShiftStatus(Enum):
    COMPLETE = "Complete"
    PROCESSING = "Processing"
    ANOMALY = "Anomaly"
    FLAGGED = "Flagged"

class AnomalyCategory(Enum):
    MALFORMED_CSV = "Malformed_CSV"
    STRUCTURAL_MISMATCH = "Structural_Mismatch"
    LOGICAL_PARADOX = "Logical_Paradox"
    IDENTITY_FAULT = "Identity_Fault"
    DUPLICATE_LOG = "Duplicate_Log"

class ErrorSeverity(Enum):
    CRITICAL = "Critical"
    WARNING = "Warning"
    INFO = "Info"

@dataclass(frozen=True)
class AuditLogEntry:
    timestamp: datetime
    action: str
    actor: str

@dataclass
class MasterModel:
    entry_id: str
    employee_id: str
    employee_full_name: str
    department_id: str
    shift_date: str  # YYYY-MM-DD
    clock_in_raw: datetime
    clock_out_raw: Optional[datetime]
    is_overnight: bool
    break_duration_minutes: int
    total_raw_minutes: int
    total_payable_minutes: int
    status: ShiftStatus
    anomaly_flags: List[str] = field(default_factory=list)
    associated_rota_shift_id: Optional[str] = None
    last_updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    audit_log: List[AuditLogEntry] = field(default_factory=list)

@dataclass(frozen=True)
class RawInputPayload:
    employee_id: Optional[str]
    employee_name: Optional[str]
    clock_in: Optional[str]
    clock_out: Optional[str]
    till_id: Optional[str]

@dataclass(frozen=True)
class InferredContext:
    potential_employee_match_id: Optional[str] = None
    closest_scheduled_rota_shift_id: Optional[str] = None
    suggested_fix_action: Optional[str] = None

@dataclass
class AnomalyExceptionModel:
    exception_id: str
    quarantine_timestamp: datetime
    error_severity: ErrorSeverity
    error_category: AnomalyCategory
    diagnostic_message: str
    raw_input_line_number: int
    raw_input_payload: RawInputPayload
    inferred_context: InferredContext
    resolution_status: str = "Unresolved"
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
