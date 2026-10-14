from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ShiftResponseSchema(BaseModel):
    employee_id: str
    employee_full_name: str
    shift_date: str
    hours_display: str  # Format: "44:30"
    decimal_hours: float  # Format: 44.50
    status: str

    class Config:
        from_attributes = True

class AnomalyResponseSchema(BaseModel):
    exception_id: str
    raw_input_line_number: int
    error_category: str
    error_severity: str
    diagnostic_message: str
    resolution_status: str

    class Config:
        from_attributes = True

class GlobalDashboardPayloadSchema(BaseModel):
    total_employees: int
    total_shifts_counted: int
    total_rows_skipped: int
    week_covered_range: str
    healthy_data_pool: List[ShiftResponseSchema]
    unhealthy_data_pool: List[AnomalyResponseSchema]
