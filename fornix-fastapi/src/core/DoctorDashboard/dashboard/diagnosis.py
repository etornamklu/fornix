from .base import BaseDashboard
from typing import Dict, List


class DifferentialDiagnosis(BaseDashboard):
    def __init__(self, system_messages: Dict, human_messages: List) -> None:
        super().__init__(system_messages, human_messages)
