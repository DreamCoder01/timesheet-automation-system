from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import AnomalyExceptionModel, ValidatedShiftModel

class ITimesheetRepository(ABC):
    """Abstract storage interface enforcing architectural isolation for valid shifts."""
    
    @abstractmethod
    def save_shift(self, shift: ValidatedShiftModel) -> None:
        """Persists a valid processed employee master shift model."""
        pass

    @abstractmethod
    def get_shifts_by_employee(self, employee_id: str) -> List[ValidatedShiftModel]:
        """Retrieves all valid stored shifts for an individual employee context."""
        pass

    @abstractmethod
    def get_all_shifts(self) -> List[ValidatedShiftModel]:
        """Retrieves every single valid processed shift within the database."""
        pass


class IAnomalyRepository(ABC):
    """Abstract storage interface enforcing architectural isolation for anomalies."""

    @abstractmethod
    def save_anomaly(self, anomaly: AnomalyExceptionModel) -> None:
        """Quarantines an anomalous tracking exception record."""
        pass

    @abstractmethod
    def get_unresolved_anomalies(self) -> List[AnomalyExceptionModel]:
        """Retrieves all quarantined log entries awaiting operator resolution."""
        pass
