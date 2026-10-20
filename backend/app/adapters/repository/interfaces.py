from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import AnomalyExceptionModel, ValidatedShiftModel

class ITimesheetRepository(ABC):
    """Abstract data gateway interface isolating valid timesheet records from database contexts."""
    
    @abstractmethod
    def save_shift(self, shift: ValidatedShiftModel) -> None:
        pass

    @abstractmethod
    def get_shifts_by_employee(self, employee_id: str) -> List[ValidatedShiftModel]:
        pass

    @abstractmethod
    def get_all_shifts(self) -> List[ValidatedShiftModel]:
        pass


class IAnomalyRepository(ABC):
    """Abstract data gateway interface isolating quarantined exceptions from database contexts."""

    @abstractmethod
    def save_anomaly(self, anomaly: AnomalyExceptionModel) -> None:
        pass

    @abstractmethod
    def get_unresolved_anomalies(self) -> List[AnomalyExceptionModel]:
        pass

    @abstractmethod
    def get_anomaly_by_id(self, exception_id: str) -> Optional[AnomalyExceptionModel]:
        pass

    @abstractmethod
    def get_adjacent_context_window(self, center_line: int, window_size: int = 2) -> List[AnomalyExceptionModel]:
        """Queries historical entries surrounding a target line to provide visual context hooks."""
        pass

    @abstractmethod
    def resolve_anomaly(self, exception_id: str, operator_name: str) -> Optional[AnomalyExceptionModel]:
        pass
