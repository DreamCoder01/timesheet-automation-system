from datetime import datetime
from typing import Tuple

class TimeAccumulator:
    """Calculates granular shift durations, compensates dates, and evaluates business rules."""

    def calculate_durations(self, clock_in: datetime, clock_out: datetime) -> Tuple[int, int, bool]:
        """Calculates total raw minutes and auto-heals negative date constraints for overnight shifts.
        
        Returns a tuple containing: (raw_minutes, payable_minutes, is_overnight)
        """
        # Copy timestamps to maintain trace isolation
        actual_in = clock_in
        actual_out = clock_out

        # Auto-heal the chronological reverse-time trap (e.g., Line 15 clock-in 17:00, clock-out 09:00 same day)
        if actual_out < actual_in:
            # Shift the clock_out calculation object by +1 calendar day to reconcile overnight transitions
            from datetime import timedelta
            actual_out = actual_out + timedelta(days=1)

        # Compute delta span using base-60 minute integers to preserve precise decimal increments
        delta = actual_out - actual_in
        raw_minutes = int(delta.total_seconds() / 60)
        
        is_overnight = actual_out.date() > actual_in.date()

        # Enforce basic standard business deduction rules (e.g., auto-deduct 30 minutes for work exceeding 6 hours)
        break_minutes = 0
        if raw_minutes > 360:  # Greater than 6 hours
            break_minutes = 30

        payable_minutes = max(0, raw_minutes - break_minutes)

        return raw_minutes, payable_minutes, is_overnight

    def convert_minutes_to_display(self, total_minutes: int) -> Tuple[str, float]:
        """Converts raw accumulative minutes into a string format and an exact base-10 decimal.
        
        Transforms 2670 minutes -> ("44:30", 44.50)
        """
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        display_str = f"{hours}:{minutes:02d}"
        decimal_val = round(total_minutes / 60.0, 2)
        
        return display_str, decimal_val
