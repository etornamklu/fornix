from collections import defaultdict
import json
from typing import Literal
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
import os

from dotenv import load_dotenv
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langchain_core.language_models import BaseChatModel
from langchain_core.runnables.base import Runnable
from langchain_core.messages import AIMessage
from langchain_openai.chat_models import ChatOpenAI
from pydantic import BaseModel
from typing_extensions import AsyncIterator, Type

from src.core.DoctorDashboard.lab_test_and_medications.prompts import (
    PHARMACOLOGICAL_PROMPT,
    NON_PHARMACOLOGICAL_PROMPT,
    LAB_TEST_PROMPT,
    FOLLOW_UP_INSTRUCTIONS,
    EDU_INFO,
    EMERGENCY_INSTRUCTIONS,
)
from src.core.DoctorDashboard.lab_test_and_medications.schema import (
    ClinicalManagement,
    NonPharmacologicalIntervention,
    LabTestRecommendation,
    ClinicalFollowUpPlan,
    PatientEducationPlan,
    EmergencyInstruction
)

_ = load_dotenv(override=True)


class DoctorDashboardWorkflow:
    def __init__(self, llm: BaseChatModel) -> None:
        self.llm = llm

    def _llm_chain(
        self,
        system_prompt: str,
        human_prompt: str | None = "{input}",
        output_schema: Type[BaseModel] | None = None,
    ) -> Runnable:
        prompt_templates = [("system", system_prompt)]
        if human_prompt:
            prompt_templates.append(("human", human_prompt))
        prompt = ChatPromptTemplate.from_messages(prompt_templates)
        if not output_schema:
            return (
                prompt
                | self.llm.with_config(config={"tags": ["analysis"]})
                | StrOutputParser()
            )

        return (
            prompt
            | self.llm.bind_tools(
                tools=[output_schema], tool_choice=output_schema.__name__
            ).with_config(config={"tags": ["analysis"]})
            | JsonOutputToolsParser(first_tool_only=True)
        )

    async def _stream(self, async_gen: AsyncIterator):
        token_stats = defaultdict(int)
        async for event_stream in async_gen:
            if (event := event_stream.get("event")) == "on_chat_model_stream":
                if (
                    tool_calls := event_stream.get("data", {})
                    .get("chunk", {})
                    .additional_kwargs.get("tool_calls")
                ):
                    if tool_calls and isinstance(tool_calls[0], dict):
                        yield json.dumps(
                            {
                                "content": tool_calls[0]
                                .get("function", {})
                                .get("arguments", "")
                            }
                        ) + "\n"
            else:
                out = event_stream["data"].get("output")
                if isinstance(out, AIMessage) and out.usage_metadata:
                    token_stats["input_tokens"] += out.usage_metadata["input_tokens"]
                    token_stats["output_tokens"] += out.usage_metadata["output_tokens"]
                    token_stats["total_tokens"] += out.usage_metadata["total_tokens"]
        yield json.dumps({"token_stats": token_stats}) + "\n"

    def clinical_management(self, patient_summary: str):
        med_chain = self._llm_chain(
            system_prompt=PHARMACOLOGICAL_PROMPT, output_schema=ClinicalManagement
        )
        return med_chain.astream_events(
            {"input": patient_summary}, version="v2", include_tags=["analysis"]
        )
    
    def non_pharmacological_recommendations(self, patient_summary: str):
        med_chain = self._llm_chain(
            system_prompt=NON_PHARMACOLOGICAL_PROMPT, output_schema=NonPharmacologicalIntervention
        )
        return med_chain.astream_events(
            {"input": patient_summary}, version="v2", include_tags=["analysis"]
        )

    def lab_test_recommendation(self, patient_summary: str):
        lab_chain = self._llm_chain(
            LAB_TEST_PROMPT, output_schema=LabTestRecommendation
        )
        return lab_chain.astream_events(
            {"input": patient_summary}, version="v2", include_tags=["analysis"]
        )

    def misc_recommendations(
        self, patient_summary: str, key: Literal["follow_up", "edu_info", "emerg"]
    ):
        human_prompt = "```{condition}```"
        match key:
            case "follow_up":
                return self._llm_chain(
                    system_prompt=FOLLOW_UP_INSTRUCTIONS,
                    human_prompt=None,
                    output_schema=ClinicalFollowUpPlan,
                ).astream_events(
                    {"condition": patient_summary}, version="v2", include_tags=["analysis"]
                )
            case "edu_info":
                return self._llm_chain(
                    system_prompt=EDU_INFO,
                    human_prompt=human_prompt,
                    output_schema=PatientEducationPlan,
                ).astream_events(
                    {"condition": patient_summary}, version="v2", include_tags=["analysis"]
                )
            case "emerg":
                return self._llm_chain(
                    system_prompt=EMERGENCY_INSTRUCTIONS,
                    human_prompt=human_prompt,
                    output_schema=EmergencyInstruction,
                ).astream_events(
                    {"condition": patient_summary}, version="v2", include_tags=["analysis"]
                )
            case _:
                raise ValueError("Invalid key. Expected one of 'follow_up', 'edu_info', 'emerg'")
