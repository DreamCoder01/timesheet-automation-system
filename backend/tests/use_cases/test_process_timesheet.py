import unittest
from unittest.mock import MagicMock, patch
from app.use_cases.process_timesheet import ProcessTimesheetPipeline
from app.domain.models import RawInputPayload, ErrorSeverity, AnomalyCategory

class TestProcessTimesheetPipeline(unittest.TestCase):

    @patch('app.use_cases.process_timesheet.HeuristicTimestampParser')
    @patch('app.use_cases.process_timesheet.IdempotencyDeduplicator')
    def test_pipeline_routes_failed_parsing_to_anomaly_pool_safely(self, mock_dedup, mock_parser):
        """Edge Case: Verifies unparseable lines become exceptions, not app crashes."""
        mock_dedup.return_value.is_duplicate.return_value = False
        mock_parser.return_value.parse_timestamp.side_effect = ValueError("Corrupt time token")
        
        pipeline = ProcessTimesheetPipeline()
        payloads = [(15, RawInputPayload("E001", "Amelia", "BrokenTime", "09:00", "T1"))]
        
        results = pipeline.execute(payloads)
        
        self.assertEqual(len(results["valid_shifts"]), 0)
        self.assertEqual(len(results["anomalies"]), 1)
        
        anomaly = results["anomalies"][0]
        self.assertEqual(anomaly.raw_input_line_number, 15)
        self.assertEqual(anomaly.error_category, AnomalyCategory.LOGICAL_PARADOX)
        self.assertEqual(anomaly.error_severity, ErrorSeverity.WARNING)

    @patch('app.use_cases.process_timesheet.HeuristicTimestampParser')
    @patch('app.use_cases.process_timesheet.IdempotencyDeduplicator')
    def test_pipeline_catches_duplicate_rows_safely(self, mock_dedup, mock_parser):
        """Verifies duplicate row entries trigger warnings rather than double pay."""
        mock_dedup.return_value.is_duplicate.return_value = True
        
        pipeline = ProcessTimesheetPipeline()
        payloads = [(7, RawInputPayload("E004", "Smith, Danny", "2026-09-07 12:00", "2026-09-07 20:00", "T2"))]
        
        results = pipeline.execute(payloads)
        
        self.assertEqual(len(results["valid_shifts"]), 0)
        self.assertEqual(len(results["anomalies"]), 1)
        
        anomaly = results["anomalies"][0]
        self.assertEqual(anomaly.error_category, AnomalyCategory.DUPLICATE_LOG)

    def test_pipeline_quarantines_missing_structural_identifiers(self):
        """Boundary Failure: A row missing an employee_id must be cleanly isolated as a structural mismatch."""
        pipeline = ProcessTimesheetPipeline()
        # Pass a payload where employee_id is completely missing (None)
        payloads = [(23, RawInputPayload(None, "Missing ID User", "2026-09-07 09:00", "2026-09-07 17:00", "T2"))]
        
        results = pipeline.execute(payloads)
        
        self.assertEqual(len(results["valid_shifts"]), 0)
        self.assertEqual(len(results["anomalies"]), 1)
        
        anomaly = results["anomalies"][0]
        self.assertEqual(anomaly.raw_input_line_number, 23)
        self.assertEqual(anomaly.error_category, AnomalyCategory.STRUCTURAL_MISMATCH)
        self.assertEqual(anomaly.error_severity, ErrorSeverity.CRITICAL)

if __name__ == "__main__":
    unittest.main()
