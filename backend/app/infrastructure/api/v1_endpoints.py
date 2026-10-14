from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from app.infrastructure.database.database import get_db
from app.infrastructure.api.schemas import GlobalDashboardPayloadSchema
from app.adapters.csv.pandas_processor import PandasCSVProcessor

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
    
    # 2. Run low-level parsing
    raw_indexed_payloads = processor.process_stream(csv_contents)
    
    # NOTE: In our next push, we will wire up the use_cases pipeline layer here 
    # to feed raw_indexed_payloads through the heuristics engine and save to the DB.
    
    # Return placeholder structural payload schema matching Sam's exact UI summary layout
    return GlobalDashboardPayloadSchema(
        total_employees=0,
        total_shifts_counted=0,
        total_rows_skipped=len(raw_indexed_payloads),
        week_covered_range="Pending processing",
        healthy_data_pool=[],
        unhealthy_data_pool=[]
    )
