from .base import BaseDashboard
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()


class ClinicalPlan(BaseDashboard):
    def __init__(self, system_messages: Dict, human_messages: List) -> None:
        super().__init__(system_messages, human_messages)
