from pydantic import BaseModel, computed_field
from typing import List, Optional
from datetime import datetime

class ShiftResponseSchema(BaseModel):
    entry_id: str
    employee_id: str
    employee_full_name: str
    department_id: str
    shift_date: str
    total_payable_minutes: int
    status: str

    class Config:
        from_attributes = True

    @computed_field
    @property
    def hours_display(self) -> str:
        """Dynamically translates absolute raw base-60 minutes into standard '44:30' clock text formats."""
        hours = self.total_payable_minutes // 60
        minutes = self.total_payable_minutes % 60
        return f"{hours}:{minutes:02d}"

    @computed_field
    @property
    def decimal_hours(self) -> float:
        """Converts internal granular base-60 integer values into clean payroll base-10 floats."""
        return round(self.total_payable_minutes / 60.0, 2)


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
