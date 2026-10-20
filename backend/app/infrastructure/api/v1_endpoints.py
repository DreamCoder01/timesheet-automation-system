from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Set, List

from app.infrastructure.database.database import get_db
from app.infrastructure.api.schemas import (
    GlobalDashboardPayloadSchema, 
    ReconciliationCorrectionSchema, 
    ContextWindowPayloadSchema,
    AnomalyResponseSchema,
    ShiftResponseSchema
)
from app.adapters.csv.pandas_processor import PandasCSVProcessor
from app.adapters.repository.sql_repository import SQLTimesheetRepository, SQLAnomalyRepository
from app.use_cases.process_timesheet import ProcessTimesheetPipeline
from app.use_cases.reprocess_anomaly import ReprocessAnomalyUseCase

router = APIRouter(prefix="/api/v1/timesheets", tags=["timesheets"])


def serialize_anomalies_to_schema(anomalies) -> List[AnomalyResponseSchema]:
    """Helper method transforming rich domain models safely into explicit 
    Pydantic network response tokens, populating raw audit context variables.
    """
    return [
        AnomalyResponseSchema(
            exception_id=a.exception_id,
            raw_input_line_number=a.raw_input_line_number,
            error_category=a.error_category.value if hasattr(a.error_category, 'value') else str(a.error_category),
            error_severity=a.error_severity.value if hasattr(a.error_severity, 'value') else str(a.error_severity),
            diagnostic_message=a.diagnostic_message,
            resolution_status=a.resolution_status,
            # Explicitly maps raw payload fields from domain to frontend schema variables
            raw_employee_id=a.raw_input_payload.employee_id if a.raw_input_payload else None,
            raw_employee_name=a.raw_input_payload.employee_name if a.raw_input_payload else None,
            raw_clock_in=a.raw_input_payload.clock_in if a.raw_input_payload else None,
            raw_clock_out=a.raw_input_payload.clock_out if a.raw_input_payload else None,
            raw_till_id=a.raw_input_payload.till_id if a.raw_input_payload else None
        ) for a in anomalies
    ]


@router.get("/dashboard", response_model=GlobalDashboardPayloadSchema)
def get_historical_dashboard(db: Session = Depends(get_db)):
    """Fetches currently preserved healthy records and pending unresolved 
    quarantine anomalies directly from the SQL database repositories.
    """
    timesheet_repo = SQLTimesheetRepository(db)
    anomaly_repo = SQLAnomalyRepository(db)

    valid_shifts = timesheet_repo.get_all_shifts()
    raw_unresolved = anomaly_repo.get_unresolved_anomalies()

    unique_employees: Set[str] = {shift.employee_id for shift in valid_shifts}
    serialized_anomalies = serialize_anomalies_to_schema(raw_unresolved)

    return GlobalDashboardPayloadSchema(
        total_employees=len(unique_employees),
        total_shifts_counted=len(valid_shifts),
        total_rows_skipped=len(serialized_anomalies),
        week_covered_range="Mon 7 Sep - Sun 13 Sep",
        healthy_data_pool=valid_shifts,
        unhealthy_data_pool=serialized_anomalies
    )


@router.post("/upload", response_model=GlobalDashboardPayloadSchema)
async def upload_till_report(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """Ingests a raw streaming till system CSV file, normalizes data,
    stores processing entries to disk, and serves up the dashboard layout.
    """
    csv_contents = await file.read()
    processor = PandasCSVProcessor()
    
    raw_indexed_payloads = processor.process_stream(csv_contents)
    
    pipeline = ProcessTimesheetPipeline()
    results = pipeline.execute(raw_indexed_payloads)
    
    timesheet_repo = SQLTimesheetRepository(db)
    anomaly_repo = SQLAnomalyRepository(db)
    
    for shift in results["valid_shifts"]:
        timesheet_repo.save_shift(shift)
        
    for anomaly in results["anomalies"]:
        anomaly_repo.save_anomaly(anomaly)
    
    valid_shifts = timesheet_repo.get_all_shifts()
    raw_unresolved = anomaly_repo.get_unresolved_anomalies()
    
    unique_employees: Set[str] = {s.employee_id for s in valid_shifts}
    serialized_anomalies = serialize_anomalies_to_schema(raw_unresolved)
    
    return GlobalDashboardPayloadSchema(
        total_employees=len(unique_employees),
        total_shifts_counted=len(valid_shifts),
        total_rows_skipped=len(serialized_anomalies),
        week_covered_range="Mon 7 Sep - Sun 13 Sep",
        healthy_data_pool=valid_shifts,
        unhealthy_data_pool=serialized_anomalies
    )


@router.get("/reconcile/{exception_id}/context", response_model=ContextWindowPayloadSchema)
def get_anomaly_context_stream_window(exception_id: str, db: Session = Depends(get_db)):
    """Queries adjacent row log lines surrounding a target quarantine item
    to give supervisors a structural contextual stream window of timeline history.
    """
    anomaly_repo = SQLAnomalyRepository(db)
    target = anomaly_repo.get_anomaly_by_id(exception_id)
    
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Target processing exception reference code could not be located."
        )
        
    adjacent_entries = anomaly_repo.get_adjacent_context_window(
        center_line=target.raw_input_line_number, 
        window_size=2
    )
    
    return ContextWindowPayloadSchema(
        center_line=target.raw_input_line_number,
        adjacent_rows=serialize_anomalies_to_schema(adjacent_entries)
    )


@router.patch("/reconcile/{exception_id}", status_code=status.HTTP_200_OK)
def reconcile_quarantine_anomaly(
    exception_id: str, 
    corrections: ReconciliationCorrectionSchema,
    db: Session = Depends(get_db)
):
    """Intercepts manual adjustments from the supervisor dashboard, runs validations,
    saves the new valid shift record, and marks the anomaly exception state as 'Resolved'.
    """
    timesheet_repo = SQLTimesheetRepository(db)
    anomaly_repo = SQLAnomalyRepository(db)
    
    reprocessor = ReprocessAnomalyUseCase(timesheet_repo, anomaly_repo)
    
    try:
        results = reprocessor.execute(
            exception_id=exception_id,
            corrections=corrections,
            operator_name="Console_Operator"
        )
        
        if results["status"] == "Error":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=results["message"])
        if results["status"] == "Conflict":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=results["message"])
            
        return results
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
