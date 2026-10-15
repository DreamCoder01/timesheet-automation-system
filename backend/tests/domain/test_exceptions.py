import unittest
from app.domain.exceptions import (
    DomainException,
    UnparseableFileException,
    BusinessRuleViolationException
)

class TestDomainExceptionsStructure(unittest.TestCase):

    def test_custom_exceptions_inherit_from_domain_base(self):
        """Arrange/Act/Assert: Verifies exceptional types correctly isolate down to core domain constraints."""
        # 1. Arrange & Act
        file_error = UnparseableFileException("Malformed CSV line array count width anomaly")
        rule_error = BusinessRuleViolationException("Negative shift time delta paradox detected")

        # 2. Assert (Validates structural inheritance invariants)
        self.assertIsInstance(file_error, DomainException)
        self.assertIsInstance(rule_error, DomainException)
        self.assertEqual(str(file_error), "Malformed CSV line array count width anomaly")

    def test_exception_string_representation(self):
        """Assert: Confirms exception string mappings preserve explicit diagnostic messaging."""
        message = "Critical boundary crash trace"
        exception = DomainException(message)
        
        self.assertEqual(str(exception), message)

    def test_business_rule_exception_string_representation(self):
        """Assert: Confirms business rule exception strings map diagnostics cleanly."""
        msg = "Operational safety boundary breached"
        ex = BusinessRuleViolationException(msg)
        self.assertEqual(str(ex), msg)

if __name__ == "__main__":
    unittest.main()
