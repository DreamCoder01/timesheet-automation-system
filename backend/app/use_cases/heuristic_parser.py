import re
from datetime import datetime, time
from typing import Optional, Tuple

class HeuristicTimestampParser:
    """Cascading date-time text interpreter engine that safely handles multiple legacy text formats."""

    # Pre-compiled common regex structures for format evaluation
    ISO_8601_PATTERN = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}')
    MILITARY_24H_PATTERN = re.compile(r'^([01]\d|2[0-3]):([0-5]\d)$')  # e.g., 06:00 or 17:00
    AM_PM_PATTERN = re.compile(r'^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$', re.IGNORECASE)  # e.g., 12:00 AM
    DASHED_DATE_PATTERN = re.compile(r'^\d{4}-\d{2}-\d{2}$') # e.g., 2026-09-08

    def parse_timestamp(self, time_str: Optional[str], fallback_date_str: Optional[str] = None) -> datetime:
        """Evaluates a raw input time string through a cascade of parsing filters.
        
        Throws a ValueError if completely unable to reconcile the text structure.
        """
        if not time_str:
            raise ValueError("Timestamp string value is empty or missing.")

        clean_str = time_str.strip()

        # 1. Match against strict ISO 8601 strings
        if self.ISO_8601_PATTERN.match(clean_str):
            try:
                # Strip trailing timezone offsets if simple parsing is needed, or parse directly
                return datetime.fromisoformat(clean_str.split('+')[0].split('Z')[0])
            except ValueError:
                pass

        # 2. Match against legacy dashed strings with time components (e.g., YYYY-MM-DD HH:MM:SS)
        try:
            return datetime.strptime(clean_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            pass

        # 3. Match against alphanumeric string variants (e.g., Mon 7 Sep 2026 9am / 09:00)
        # Attempt standard split translation if day words are present
        try:
            # Handle text strings like "Mon 7 Sep 2026 09:00"
            return datetime.strptime(clean_str, "%a %d %b %Y %H:%M")
        except ValueError:
            pass

        # 4. Handle isolated hours only (e.g., "09:00" or "12:00 AM")
        # Requires an explicit operational context fallback date configuration
        if fallback_date_str:
            target_date = datetime.strptime(fallback_date_str.strip(), "%Y-%m-%d").date()
            
            # Check for Military 24h format
            mil_match = self.MILITARY_24H_PATTERN.match(clean_str)
            if mil_match:
                hr, mn = map(int, mil_match.groups())
                return datetime.combine(target_date, time(hour=hr, minute=mn))
                
            # Check for 12h AM/PM format
            ampm_match = self.AM_PM_PATTERN.match(clean_str)
            if ampm_match:
                hr_str, mn_str, period = ampm_match.groups()
                hr, mn = int(hr_str), int(mn_str)
                if period.upper() == "PM" and hr != 12:
                    hr += 12
                elif period.upper() == "AM" and hr == 12:
                    hr = 0
                return datetime.combine(target_date, time(hour=hr, minute=mn))

        raise ValueError(f"Unmapped chronological text pattern format: '{time_str}'")
