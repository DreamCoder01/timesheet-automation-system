import hashlib
from typing import Set
from app.domain.models import RawInputPayload

class IdempotencyDeduplicator:
    """Intercepts identical raw rows within an execution pool using unique signatures."""

    def __init__(self):
        self._seen_hashes: Set[str] = set()

    def generate_row_hash(self, payload: RawInputPayload) -> str:
        """Compiles an unique hash representation signature for a raw incoming dataset row."""
        raw_signature_string = (
            f"{payload.employee_id or ''}|"
            f"{payload.employee_name or ''}|"
            f"{payload.clock_in or ''}|"
            f"{payload.clock_out or ''}|"
            f"{payload.till_id or ''}"
        )
        return hashlib.sha256(raw_signature_string.encode('utf-8')).hexdigest()

    def is_duplicate(self, payload: RawInputPayload) -> bool:
        """Determines if the signature exists in the pool. Adds it if unique."""
        row_hash = self.generate_row_hash(payload)
        if row_hash in self._seen_hashes:
            return True
        self._seen_hashes.add(row_hash)
        return False
