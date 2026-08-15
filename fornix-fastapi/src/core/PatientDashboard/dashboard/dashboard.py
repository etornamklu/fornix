# dashboard.py
import json
import os
import re
import asyncio
from typing import Dict, Any
from typing_extensions import deprecated

from dotenv import load_dotenv

from langchain.schema import AIMessage, ChatMessage

# from config.logger_config import configure_logger
from src.core.PatientDashboard.schema.patient_data_schema import (
    PatientDataSchema,
    StaticPatientData,
)

from src.core.PatientDashboard.schema.tagging_chain_schema import TaggingChainSchema
from src.core.PatientDashboard.utils.age_calc import age_calculator
from src.core.PatientDashboard.utils.qa_chain import QAChain
from src.core.PatientDashboard.utils.tagging_chain import pydantic_tagging_chain

load_dotenv()
# logger = configure_logger(__name__)


def load_fields_from_file(desc):
    file_path = os.path.join("src", "core", "PatientDashboard", "static", desc)
    # file_path = os.path.join("static", desc)
    absolute_path = os.path.abspath(file_path)
    # file_path = f"PatientDashboard{os.sep}static{os.sep}{desc}"
    with open(absolute_path) as fp:
        fields: dict = json.load(fp)
    return fields

@deprecated("This module is deprecated. Use `MainAgentGraph` instead.", category=DeprecationWarning, stacklevel=2)
class PatientDataCollectorChain(QAChain):
    @classmethod
    def add_method(cls, func):
        setattr(cls, func.__name__, func)
        return func

    def __init__(self, llm, verbose):
        super().__init__(llm, verbose)
        self.questions = ["Hi"]
        self.qtn_keys = ["Greetings"]
        self.tagging_chain = pydantic_tagging_chain(self.llm, TaggingChainSchema)
        self.field_dict: Dict = load_fields_from_file("general_fields.json")
        self.keys = list(self.field_dict.keys())
        self._asked = list()
        self._qtn_index = 0
        self.conversation_end = False

    def __repr__(self) -> str:
        return "<Class 'PatientDataCollector'>"

    def start_conversation(self, static_data: StaticPatientData):
        if len(self.history) == 0:
            self.patient = PatientDataSchema(**static_data)

    @staticmethod
    def is_empty(value: Any) -> bool:
        return value in [None, "", 0] or (
            (isinstance(value, list) or isinstance(value, dict)) and len(value) == 0
        )

    def update_data(self, current_details, new_details):
        non_empty_details = {
            k: v for k, v in new_details.dict().items() if not self.is_empty(v)
        }
        self.patient = current_details.copy(update=non_empty_details)

    def get_question(self, ask_for):
        chain = super().qa_chain(self.llm)
        # 'past_medical_history': self.patient.past_medical_history,
        # 'smoking': self.patient.smoking,
        #     'alcohol': self.patient.alcohol,
        #     'recreational_drug_use': self.patient.recreational_drug_use,
        #     'previous_admissions': self.patient.previous_admissions,
        #     'diet': self.patient.diet,
        patient_info = {
            "firstname": (self.patient.nickname or self.patient.firstname),
            "gender": self.patient.gender,
            "age": age_calculator(self.patient.date_of_birth),
            "occupation": self.patient.occupation,
            "previous_surgeries": self.patient.previous_surgeries,
            "allergies": self.patient.allergies,
            "medications": self.patient.medications,
            "family_medical_history": self.patient.family_medical_history,
            "lifestyle_habits": self.patient.lifestyle_habits,
            "dietary_habits": self.patient.dietary_habits,
            "psychosocial_history": self.patient.psychosocial_history,
            "past_medical_history": self.patient.medications,
            "smoking": self.patient.lifestyle_habits,
            "alcohol": self.patient.lifestyle_habits,
            "recreational_drug_use": self.patient.psychosocial_history,
            "previous_admissions": self.patient.previous_surgeries,
            "diet": self.patient.dietary_habits,
        }
        return chain.run(ask_for=ask_for, **patient_info)

    def get_field(self, key, dictionary: dict):
        try:
            value = dictionary[key]
            self._asked.append(key)
            return (key, value)
        except KeyError:
            return None, None

    def add_title(self, name, gender, married):
        title_patterns = {
            "male": re.compile(r"\bMr\.\b", re.IGNORECASE),
            "female": {
                "married": re.compile(r"\bMrs\.\b", re.IGNORECASE),
                "single": re.compile(r"\bMiss\b", re.IGNORECASE),
            },
        }

        if any(pattern.search(name) for pattern in title_patterns.values()):
            return name

        if gender.lower() == "male":
            return "Mr. " + name
        elif gender.lower() == "female":
            return "Mrs. " + name if married else "Miss " + name
        else:
            return name

    def get_thank_you_message(self):
        name = f"{self.patient.firstname} {self.patient.middle_name} {self.patient.lastname}"
        gender = self.patient.gender
        married = self.patient.marital_status.lower() == "married"
        name = self.add_title(name, gender, married)
        message = f"Thank you for your time, { ' '.join(str(name).split('  '))}. Your data is being sent to the doctor for review."
        return message

    def update_history_and_get_question(self, message, ask_for):
        self.history.extend([ChatMessage(content=message, role="user")])
        qtn = self.get_question(str(ask_for))
        self.history.extend([AIMessage(content=qtn)])
        return qtn

    async def process_question(self, message, ask_for):
        qtn = self.update_history_and_get_question(message, ask_for)

        async def run_invoke():
            self._qtn_index += 1
            new_data = await self.tagging_chain.ainvoke(
                {
                    "name": f"{self.patient.firstname} {self.patient.middle_name} {self.patient.lastname}",
                    "question": self.questions[self._qtn_index - 1],
                    "key": self.qtn_keys[self._qtn_index - 1],
                    "input": f"{message}",
                }
            )
            self.update_data(self.patient, new_data)
            # logger.info(self.patient)

        self.invoke_task = asyncio.create_task(run_invoke())

        return qtn

    async def get_completion(self, message, static_data):
        self.start_conversation(static_data)
        if self.conversation_end:
            return self.get_thank_you_message()
        key = self.keys[0] if self.keys else None
        key, ask_for = self.get_field(key, self.field_dict)
        qtn = await self.process_question(message, ask_for)

        self.questions.append(qtn)
        self.qtn_keys.append(key)

        try:
            self.keys.remove(key)
        except ValueError:
            self.conversation_end = True

        return qtn

    async def __call__(self, message):
        return await self.get_completion(message)
