class DomainException(Exception):
    """Base exception for all domain-specific errors."""
    pass

class UnparseableFileException(DomainException):
    """Raised when the incoming file stream is corrupted or unreadable."""
    pass

class BusinessRuleViolationException(DomainException):
    """Raised when data breaks physical constraints or operational thresholds."""
    pass
