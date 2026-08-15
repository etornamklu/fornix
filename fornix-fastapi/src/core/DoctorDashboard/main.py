import json
from langchain_openai.chat_models import ChatOpenAI
from dotenv import load_dotenv
from langchain.callbacks import AsyncIteratorCallbackHandler
from typing import AsyncGenerator, Literal, Awaitable, Dict
import asyncio
from langchain.schema.runnable import Runnable
from pathlib import Path
from deprecated import deprecated

from src.core.DoctorDashboard.dashboard.clinical_plan import ClinicalPlan
from src.core.DoctorDashboard.dashboard.diagnosis import DifferentialDiagnosis


@deprecated(version="0.0.1", reason="Use AnalysisDashboard instead")
class AnalysisDashboard:
    def __init__(
        self, diagnosis_template_path, clinical_plan_template_path, streaming=True
    ) -> None:
        self.streaming = streaming
        self.dd = DifferentialDiagnosis(
            **AnalysisDashboard.load_messages(diagnosis_template_path),
        )
        self.clinical_plan = ClinicalPlan(
            **AnalysisDashboard.load_messages(clinical_plan_template_path),
        )
        self.patient_data = None

    def load_llm(self, streaming: bool):
        self.callback_handler = AsyncIteratorCallbackHandler()
        llm = ChatOpenAI(
            temperature=0,
            model="gpt-3.5-turbo",
            streaming=streaming,
            callbacks=[self.callback_handler] if streaming else None,
        )
        return llm

    @classmethod
    def load_messages(cls, path: str) -> dict:
        with open(path) as fp:
            messages: Dict = json.load(fp)
            return messages

    async def wrap_done(self, fn: Awaitable, event: asyncio.Event):
        try:
            await fn
        except Exception as e:
            print(f"Caught Exception: {e}")
        finally:
            event.set()

    async def get_chain_output(
        self, patient_info: dict, chain_key, stop=None
    ) -> AsyncGenerator:
        llm = self.load_llm(self.streaming)
        chain: Runnable = self.dd.chain_builder(llm, chain_key, stop=stop)
        task = asyncio.create_task(
            self.wrap_done(chain.ainvoke(patient_info), self.callback_handler.done)
        )

        async for token in self.callback_handler.aiter():
            yield token

        await task

    async def get_summary(self, patient_data: dict) -> AsyncGenerator:
        self.patient_data = patient_data
        async for token in self.get_chain_output(patient_data, "summary"):
            yield token

    async def get_diagnosis_completion(self, patient_summary: dict) -> AsyncGenerator:
        stop = ["Note", "NOTE", "Please"]
        async for token in self.get_chain_output(patient_summary, "diagnosis", stop):
            yield token

    async def get_clinical_completion(
        self,
        patient_summary: dict,
        key: Literal["tests", "drugs", "non_pharm", "follow_up", "edu_info", "emerg"],
    ):
        llm = self.load_llm(self.streaming)
        stop = ["It's important to", "It is important", "Please", "Note"]
        chain: Runnable = self.clinical_plan.chain_builder(llm, key, stop=stop)
        task = asyncio.create_task(
            self.wrap_done(chain.ainvoke(patient_summary), self.callback_handler.done)
        )
        async for token in self.callback_handler.aiter():
            yield token

        await task


# Construct full file paths using pathlib.Path
BASE_PATH = Path("DoctorDashboard") / "templates"
DIAGNOSIS_TEMPLATE_PATH = BASE_PATH / "diff_diagnosis.json"
CLINICAL_PLAN_TEMPLATE_PATH = BASE_PATH / "clinical_plan.json"
