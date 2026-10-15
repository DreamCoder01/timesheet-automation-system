import unittest
from io import BytesIO
from app.adapters.csv.pandas_processor import PandasCSVProcessor
from app.domain.exceptions import UnparseableFileException

class TestPandasCSVProcessor(unittest.TestCase):

    def setUp(self):
        self.processor = PandasCSVProcessor()

    def test_processor_handles_quoted_names_with_commas_cleanly(self):
        """Edge Case 1: Verifies RFC 4180 parsing locks quoted strings safely."""
        csv_data = b'employee_id,employee_name,clock_in,clock_out,till_id\nE004,"Smith, Danny",2026-09-07 12:00,2026-09-07 20:00,T2'
        
        results = self.processor.process_stream(csv_data)
        
        self.assertEqual(len(results), 1)
        line_num, payload = results[0]
        self.assertEqual(line_num, 2)
        self.assertEqual(payload.employee_name, "Smith, Danny")

    def test_processor_throws_exception_on_missing_column_headers(self):
        """Boundary Failure: Broken CSV schema triggers immediate domain crash isolation."""
        broken_csv = b'employee_id,clock_in,clock_out\nE001,09:00,17:00'
        
        with self.assertRaises(UnparseableFileException):
            self.processor.process_stream(broken_csv)
