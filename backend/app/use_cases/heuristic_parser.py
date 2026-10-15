import re
from datetime import datetime, time, timezone
from typing import Optional

class HeuristicTimestampParser:
    """Cascading date-time text interpreter engine that safely handles multiple legacy text formats."""

    ISO_8601_PATTERN = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}')
    MILITARY_24H_PATTERN = re.compile(r'^(0?\d|1\d|2[0-3]):([0-5]\d)$')
    AM_PM_PATTERN = re.compile(r'^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$', re.IGNORECASE)

    def parse_timestamp(self, time_str: Optional[str], fallback_date_str: Optional[str] = None) -> datetime:
        if not time_str:
            raise ValueError("Timestamp string value is empty or missing.")

        clean_str = time_str.strip()

        # 1. Handle ISO 8601 Strings
        if self.ISO_8601_PATTERN.match(clean_str):
            try:
                base_iso = clean_str.split('+')[0].split('Z')[0]
                return datetime.fromisoformat(base_iso)
            except ValueError:
                pass

        # 2. Test full date string variants sequentially
        datetime_formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%d-%m-%Y %I:%M %p",
            "%d/%m/%Y %H:%M",
            "%Y/%m/%d %H:%M",
        ]
        
        for fmt in datetime_formats:
            try:
                return datetime.strptime(clean_str, fmt)
            except ValueError:
                continue

        # 3. Handle loose textual variants (e.g., "Mon 7 Sep 2026 9am")
        normalized_text = clean_str.lower().replace('am', ' am').replace('pm', ' pm')
        normalized_text = re.sub(r'\s+', ' ', normalized_text)
        
        text_formats = [
            "%a %d %b %Y %I %p",
            "%a %d %b %Y %H:%M",
            "%d %b %Y %I %p",
            "%d %b %Y %H:%M",
        ]
        for fmt in text_formats:
            try:
                return datetime.strptime(normalized_text, fmt)
            except ValueError:
                continue

        # 4. Handle isolated hours only (e.g., "09:00" or "12:00 AM") via fallback reference dates
        if fallback_date_str:
            try:
                target_date = datetime.strptime(fallback_date_str.strip(), "%Y-%m-%d").date()
                
                mil_match = self.MILITARY_24H_PATTERN.match(clean_str)
                if mil_match:
                    hr, mn = map(int, mil_match.groups())
                    return datetime.combine(target_date, time(hour=hr, minute=mn))
                    
                ampm_match = self.AM_PM_PATTERN.match(clean_str)
                if ampm_match:
                    hr_str, mn_str, period = ampm_match.groups()
                    hr, mn = int(hr_str), int(mn_str)
                    if period.upper() == "PM" and hr != 12:
                        hr += 12
                    elif period.upper() == "AM" and hr == 12:
                        hr = 0
                    return datetime.combine(target_date, time(hour=hr, minute=mn))
            except Exception:
                pass

        raise ValueError(f"Unmapped chronological text pattern format: '{time_str}'")
