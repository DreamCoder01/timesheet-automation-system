from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.infrastructure.database.database import get_db
from app.infrastructure.api.schemas import GlobalDashboardPayloadSchema
from app.adapters.csv.pandas_processor import PandasCSVProcessor
from app.use_cases.process_timesheet import ProcessTimesheetPipeline  # <-- Verify this import is active

router = APIRouter(prefix="/api/v1/timesheets", tags=["timesheets"])

@router.post("/upload", response_model=GlobalDashboardPayloadSchema)
async def upload_till_report(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """Ingests a raw streaming till system CSV file, triggers the normalization

    pipeline, and serves up the final structured aggregation dashboard package.
    """
    # 1. Initialize Ingestion Adapters
    csv_contents = await file.read()
    processor = PandasCSVProcessor()
    
    # 2. Run low-level parsing (This now handles your header whitespace trimmers!)
    raw_indexed_payloads = processor.process_stream(csv_contents)
    
    # 3. Instantiate and run your core business processing logic loop
    pipeline = ProcessTimesheetPipeline()
    results = pipeline.execute(raw_indexed_payloads)
    
    # NOTE: In an upcoming sprint, we will add repository saves here:
    # for shift in results["valid_shifts"]: repo.save(shift)
    
    # 4. Map the engine output lists directly to our production-ready schema contract
    return GlobalDashboardPayloadSchema(
        total_employees=len(set([s.employee_id for s in results["valid_shifts"]])),
        total_shifts_counted=len(results["valid_shifts"]),
        total_rows_skipped=len(results["anomalies"]),
        week_covered_range="Mon 7 Sep - Sun 13 Sep",
        healthy_data_pool=results["valid_shifts"],
        unhealthy_data_pool=results["anomalies"]
    )
