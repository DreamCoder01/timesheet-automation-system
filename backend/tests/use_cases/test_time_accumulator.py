import unittest
from datetime import datetime
from app.use_cases.time_accumulator import TimeAccumulator

class TestTimeAccumulator(unittest.TestCase):

    def setUp(self):
        self.accumulator = TimeAccumulator()

    def test_standard_shift_calculates_minutes_correctly(self):
        """Tests standard 8-hour day shift (480 mins) with 30-min auto-break deduction."""
        clock_in = datetime(2026, 9, 7, 9, 0)
        clock_out = datetime(2026, 9, 7, 17, 0)
        
        raw_m, payable_m, is_overnight = self.accumulator.calculate_durations(clock_in, clock_out)
        
        self.assertFalse(is_overnight)
        self.assertEqual(raw_m, 480)
        self.assertEqual(payable_m, 450)

    def test_short_shift_omits_break_deduction(self):
        """Tests that shifts under 6 hours do not trigger a break deduction."""
        clock_in = datetime(2026, 9, 7, 9, 0)
        clock_out = datetime(2026, 9, 7, 13, 0)
        
        raw_m, payable_m, is_overnight = self.accumulator.calculate_durations(clock_in, clock_out)
        
        self.assertEqual(raw_m, 240)
        self.assertEqual(payable_m, 240)

    def test_minute_to_display_conversion(self):
        """Verifies string text display mapping logic rules conversion precision."""
        display_str, decimal_val = self.accumulator.convert_minutes_to_display(2670)
        
        self.assertEqual(display_str, "44:30")
        self.assertEqual(decimal_val, 44.50)

if __name__ == "__main__":
    unittest.main()
