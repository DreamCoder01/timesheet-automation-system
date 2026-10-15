from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.infrastructure.database.database import Base

class Timesheet(Base):
    """SQL database structure representing structural outputs of processed ValidatedShiftModels."""
    __tablename__ = "timesheets"

    entry_id = Column(String, primary_key=True, index=True)
    employee_id = Column(String, index=True, nullable=False)
    employee_full_name = Column(String, nullable=False)
    department_id = Column(String, nullable=False)
    shift_date = Column(String, nullable=False)  # YYYY-MM-DD
    clock_in_raw = Column(DateTime, nullable=False)
    clock_out_raw = Column(DateTime, nullable=True)
    is_overnight = Column(Boolean, nullable=False)
    break_duration_minutes = Column(Integer, nullable=False)
    total_raw_minutes = Column(Integer, nullable=False)
    total_payable_minutes = Column(Integer, nullable=False)
    status = Column(String, nullable=False)


class Anomaly(Base):
    """SQL database containment vault tracking quarantined legacy file processing exceptions."""
    __tablename__ = "anomalies"

    exception_id = Column(String, primary_key=True, index=True)
    quarantine_timestamp = Column(DateTime, nullable=False)
    error_severity = Column(String, nullable=False)
    error_category = Column(String, nullable=False)
    diagnostic_message = Column(Text, nullable=False)
    raw_input_line_number = Column(Integer, nullable=False)
    
    # Store raw source string inputs directly as flattened JSON keys for reference
    raw_employee_id = Column(String, nullable=True)
    raw_employee_name = Column(String, nullable=True)
    raw_clock_in = Column(String, nullable=True)
    raw_clock_out = Column(String, nullable=True)
    raw_till_id = Column(String, nullable=True)
    
    resolution_status = Column(String, default="Unresolved")
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
