import unittest
from app.domain.models import RawInputPayload
from app.use_cases.deduplicator import IdempotencyDeduplicator

class TestIdempotencyDeduplicator(unittest.TestCase):

    def setUp(self):
        self.deduplicator = IdempotencyDeduplicator()

    def test_deduplicator_flags_identical_payloads_as_duplicates(self):
        """Asserts that identical payloads trigger true boolean returns on second scan."""
        payload = RawInputPayload("E004", "Danny Smith", "12:00", "20:00", "T2")
        
        self.assertFalse(self.deduplicator.is_duplicate(payload))
        self.assertTrue(self.deduplicator.is_duplicate(payload))

if __name__ == "__main__":
    unittest.main()
