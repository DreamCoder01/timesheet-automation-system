import pandas as pd
from io import BytesIO
from typing import List, Tuple
from app.domain.models import RawInputPayload
from app.domain.exceptions import UnparseableFileException

class PandasCSVProcessor:
    """Handles low-level CSV file stream ingestion, structural verification,

    and string sanitization using Pandas.
    """
    
    REQUIRED_COLUMNS = ["employee_id", "employee_name", "clock_in", "clock_out", "till_id"]

    def process_stream(self, file_content: bytes) -> List[Tuple[int, RawInputPayload]]:
        """Parses raw file bytes into indexed RawInputPayload domain structures.
        
        Skips completely empty lines gracefully. Throws UnparseableFileException
        if structural schema validations fail.
        """
        # --- FIX: Build an exact physical file-line mapping to eliminate row shifts ---
        try:
            raw_lines = file_content.decode("utf-8", errors="ignore").splitlines()
        except Exception as e:
            raise UnparseableFileException(f"Failed to decode CSV bytes stream: {str(e)}")

        line_index_map = {}
        current_physical_line = 1
        data_row_counter = 0

        for line in raw_lines:
            # Enforce line counting only on active, non-blank rows matching skip_blank_lines behavior
            if line.strip():
                if current_physical_line > 1:  # Bypass header row tracking
                    line_index_map[data_row_counter] = current_physical_line
                    data_row_counter += 1
            current_physical_line += 1

        try:
            # Read CSV stream buffer. Use keep_default_na=False to avoid converting string hashes or nulls into NaN floats
            df = pd.read_csv(BytesIO(file_content), skip_blank_lines=True, keep_default_na=False, dtype=str)
        except Exception as e:
            raise UnparseableFileException(f"Failed to read CSV stream structure: {str(e)}")

        # Normalize column header casings and strip accidental whitespace
        df.columns = [str(col).strip().lower() for col in df.columns]

        # Verify structural width integrity against the core requirement spec
        for req_col in self.REQUIRED_COLUMNS:
            if req_col not in df.columns:
                raise UnparseableFileException(
                    f"Invalid CSV structure. Missing mandatory header column: '{req_col}'."
                )

        sanitized_payloads: List[Tuple[int, RawInputPayload]] = []

        # Process each row, matching the DataFrame index against our absolute file line map
        for index, row in df.iterrows():
            # Looks up the true line context position on disk, falling back safely if unmapped
            line_number = line_index_map.get(int(index), int(index) + 2)

            # Clean outer quotes and structural spacing on data inputs
            raw_payload = RawInputPayload(
                employee_id=str(row.get("employee_id", "")).strip() or None,
                employee_name=str(row.get("employee_name", "")).strip() or None,
                clock_in=str(row.get("clock_in", "")).strip() or None,
                clock_out=str(row.get("clock_out", "")).strip() or None,
                till_id=str(row.get("till_id", "")).strip() or None
            )
            
            sanitized_payloads.append((line_number, raw_payload))

        return sanitized_payloads
