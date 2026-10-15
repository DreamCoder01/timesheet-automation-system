import unittest
from datetime import datetime
from app.use_cases.heuristic_parser import HeuristicTimestampParser

class TestHeuristicTimestampParser(unittest.TestCase):

    def setUp(self):
        self.parser = HeuristicTimestampParser()
        self.fallback = "2026-09-07"

    def test_parser_reconciles_fragmented_legacy_formats(self):
        """Matrix testing multiple valid string layouts against target primitives."""
        test_matrix = [
            ("2026-09-07T08:00:00+00:00", datetime(2026, 9, 7, 8, 0)),
            ("2026-09-07 06:00", datetime(2026, 9, 7, 6, 0)),
            ("07-09-2026 09:00 AM", datetime(2026, 9, 7, 9, 0)),
            ("Mon 7 Sep 2026 9am", datetime(2026, 9, 7, 9, 0)),
            ("09:00", datetime(2026, 9, 7, 9, 0)),
        ]

        for input_str, expected_dt in test_matrix:
            with self.subTest(input_str=input_str):
                result = self.parser.parse_timestamp(input_str, self.fallback)
                self.assertEqual(result, expected_dt)

    def test_parser_handles_malformed_iso_exception_branch(self):
        """Forces execution through the try/except catch within the ISO 8601 splitter layer."""
        # A string that matches the ISO regex prefix but triggers a fromisoformat ValueError
        malformed_iso = "2026-09-07T99:99:99+00:00"
        with self.assertRaises(ValueError):
            self.parser.parse_timestamp(malformed_iso, self.fallback)

    def test_parser_throws_value_error_on_empty_or_missing_input(self):
        """Boundary Failure: Passing None or empty strings triggers immediate validation failure."""
        with self.assertRaises(ValueError) as ctx:
            self.parser.parse_timestamp(None, self.fallback)
        self.assertEqual(str(ctx.exception), "Timestamp string value is empty or missing.")

        with self.assertRaises(ValueError):
            self.parser.parse_timestamp("   ", self.fallback)

    def test_parser_throws_value_error_on_completely_unmapped_format(self):
        """Boundary Failure: Passing garbage characters safely raises an unmapped format exception."""
        with self.assertRaises(ValueError) as ctx:
            self.parser.parse_timestamp("unparseable_garbage_text", self.fallback)
        self.assertIn("Unmapped chronological text pattern format", str(ctx.exception))

if __name__ == "__main__":
    unittest.main()
