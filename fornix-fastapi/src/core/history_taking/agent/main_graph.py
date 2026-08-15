"""A module for the main graph of the history taking agent."""

import json
from langgraph.graph import StateGraph, END
from langchain_core.messages import ToolMessage
from langchain_core.language_models import BaseChatModel
from typing import Any, Dict, TYPE_CHECKING, Literal, Optional
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig, ensure_config
from loguru import logger
from pydantic import ValidationError
from langchain_community.llms.fake import FakeStreamingListLLM

from src.database.database_connection import get_db
from src.database.models import patient_data as pd

from ..schemas.personal_information import PersonalInformation
from ..schemas.permission import PermissionDenied
from ..schemas.social_history import SocialHistory
from ..schemas.previous_medical_history import PreviousMedicalHistorySchema
from ..schemas.complaint import ChiefComplaintSchema
from ..schemas.systemic_enquiry import SystemsEnquiry
from ..schemas.family import FamilyHistory
from ..schemas.drugs_and_allergies import DrugHistoryAndAllergies
from ..schemas.patient_history import PatientHistory
from .sub_agent import SubAgent, ChiefComplainAgent
from ..prompts import prompts
from ..db.utilities import get_static_patient_data
from .state import OutputSchema, AgentState

if TYPE_CHECKING:
    from langgraph.checkpoint.base import BaseCheckpointSaver
    from langgraph.graph.graph import CompiledGraph


class MainAgentGraph:
    def __init__(
        self,
        llm: BaseChatModel,
        doctor_name: str = "JD",
        hospital_name: str = "Zomujo",
        branch_name: str = "Remote Care Clinic",
    ) -> None:
        self.llm = llm
        self._doctor_name = doctor_name
        self._hospital_name = hospital_name
        self._branch_name = branch_name
        self.sub_agents = self.init_sub_agents(llm)
        self.agent_names = tuple(self.sub_agents.keys())
        self.output_parser = JsonOutputToolsParser(first_tool_only=True, return_id=True)
        self.db = next(get_db())
        self.db_models = {
            "personal_information": pd.PersonalInformation,
            "family_history": pd.FamilyHistory,
            "social_history": pd.SocialHistory,
            "chief_complaint": pd.ChiefComplaint,
            "medical_history": pd.MedicalHistory,
            "systemic_enquiry": pd.SystemicEnquiry,
            "drug_and_allergy": pd.DrugHistoryAndAllergies,
        }

        self.graph = StateGraph(AgentState, output=OutputSchema)  # type: ignore

        self.graph.add_node("static_data", self.get_patient_static_data)
        for name, agent in self.sub_agents.items():
            self.graph.add_node(name, agent)
        # self.graph.add_node("summary", self.summarize)
        self.graph.add_node("engine", self.validate_state)  # type: ignore[arg-type]
        self.graph.add_node("conclude_conversation", self.conclude_conversation)
        self.graph.set_entry_point("static_data")
        self.graph.add_conditional_edges("static_data", self.entry_point_fn)
        for node in self.sub_agents:
            self.graph.add_conditional_edges(
                node, self.should_validate, {"engine": "engine", END: END}
            )
        self.graph.add_conditional_edges("engine", self.entry_point_fn)

        # self.graph.add_conditional_edges(
        #     "summary", self.should_validate, {"engine": "engine", END: END}
        # )
        self.graph.add_conditional_edges("conclude_conversation", self.should_validate)

    def compile_graph(
        self,
        checkpointer: "BaseCheckpointSaver",
        interrupt_before: list[str] | Literal["*"] | None = None,
    ) -> "CompiledGraph":
        return self.graph.compile(
            checkpointer=checkpointer, interrupt_before=interrupt_before
        )

    @property
    def doctor_name(self) -> str:
        return self._doctor_name

    @doctor_name.setter
    def doctor_name(self, name: str) -> None:
        if name:
            self._doctor_name = name
        else:
            raise ValueError("Doctor name cannot be empty or None")

    @property
    def hospital_name(self) -> str:
        return self._hospital_name

    @hospital_name.setter
    def hospital_name(self, name: str) -> None:
        if name:
            self._hospital_name = name
        else:
            raise ValueError("Hospital name cannot be empty or None")

    @property
    def branch_name(self) -> str:
        return self._branch_name

    @branch_name.setter
    def branch_name(self, name: str) -> None:
        if name:
            self._branch_name = name
        else:
            raise ValueError("Branch name cannot be empty or None")

    def init_sub_agents(self, llm: BaseChatModel) -> Dict[str, SubAgent]:
        default_ai_message=prompts.DEFAULT_AI_MESSAGE.format(
                    agent_name=self.doctor_name,
                    hospital_name=self.hospital_name,
                    branch_name=self.branch_name,
                )
        sub_agents = [
            SubAgent(
                llm,
                prompts.PERSONAL_INFORMATION.format(
                    agent_name=self.doctor_name,
                    hospital_name=self.hospital_name,
                    branch_name=self.branch_name,
                    next_doctor="presenting complaints specialist",
                ),
                [PersonalInformation, PermissionDenied],
                "personal_information",
                default_ai_message
            ),
            ChiefComplainAgent(
                llm,
                [ChiefComplaintSchema],
                "chief_complaint",
                default_ai_message=default_ai_message
            ),
            SubAgent(
                llm,
                prompts.PREVIOUS_MEDICAL_HISTORY.format(
                    next_doctor="system enquiry specialist",
                    agent_name="medical history specialist",
                ),
                [PreviousMedicalHistorySchema],
                "medical_history",
                default_ai_message=default_ai_message
            ),
            SubAgent(
                llm,
                prompts.SYSTEM_ENQUIRY.format(
                    next_doctor="drug and allergy specialist",
                    agent_name="systemic specialist",
                ),
                [SystemsEnquiry],
                "systemic_enquiry",
                default_ai_message=default_ai_message
            ),
            SubAgent(
                llm,
                prompts.DRUG_AND_ALLERGY.format(
                    next_doctor="family history specialist",
                    agent_name="drug and allergy specialist",
                ),
                [DrugHistoryAndAllergies],
                "drug_and_allergy",
                default_ai_message=default_ai_message
            ),
            SubAgent(
                llm,
                prompts.FAMILY_HISTORY.format(
                    next_doctor="social history specialist",
                    agent_name="family history specialist",
                ),
                [FamilyHistory],
                "family_history",
                default_ai_message=default_ai_message
            ),
            SubAgent(
                llm,
                prompts.SOCIAL_HISTORY.format(
                    agent_name="social history specialist",
                ),
                [SocialHistory],
                "social_history",
                default_ai_message=default_ai_message
            ),
        ]
        logger.info("Added all sub agents")
        return {agent.name: agent for agent in sub_agents}

    async def get_patient_static_data(
        self, state: AgentState, config: Optional[RunnableConfig] = None
    ) -> Dict[str, Any]:
        patient_history = state.get("patient_history")
        if not patient_history:
            patient_history = {}
        is_existing_patient = state.get("is_existing_patient", False)
        last_seen = state.get("last_seen", "")
        latest_chief_complaint = state.get("latest_chief_complaint", "")
        config = ensure_config(config)
        patient_id = config.get("configurable", {}).get("patient_id")
        if not patient_id:
            raise ValueError("Patient ID not found in config")

        with self.db as session:
            user = await get_static_patient_data(session, patient_id)
            if not user:
                raise ValueError("Patient with ID %s does not exist!" % patient_id)

            personal_info = user.personal_information
            family_history = user.family_history
            social_history = user.social_history
            chief_complaints = user.chief_complaint

            if chief_complaints:
                latest_complaint = chief_complaints[-1]
                latest_chief_complaint = str(latest_complaint.presenting_complaints)
                last_seen = latest_complaint.created_at.strftime(
                    "%B %d, %Y at %I:%M %p"
                )

            is_existing_patient = self._update_patient_history(
                is_existing_patient,
                patient_history,
                personal_info,
                family_history,
                social_history,
            )

        return {
            "patient_history": patient_history,
            "is_existing_patient": is_existing_patient,
            "last_seen": last_seen,
            "latest_chief_complaint": latest_chief_complaint,
        }

    def _update_patient_history(
        self,
        is_existing_patient: bool | None,
        patient_history: Dict,
        personal_info,
        family_history,
        social_history,
    ) -> bool | None:

        if personal_info and "personal_information" not in patient_history:
            is_existing_patient = True
            patient_history["personal_information"] = json.loads(
                PersonalInformation(**personal_info.__dict__).json(
                    exclude_none=True, exclude_unset=True
                )
            )

        if family_history and "family_history" not in patient_history:
            patient_history["family_history"] = json.loads(
                FamilyHistory(**family_history.__dict__).json(
                    exclude_none=True, exclude_unset=True
                )
            )

        if social_history and "social_history" not in patient_history:
            patient_history["social_history"] = json.loads(
                SocialHistory(**social_history.__dict__).json(
                    exclude_none=True, exclude_unset=True
                )
            )

        return is_existing_patient

    # async def summarize(self, state: AgentState) -> Dict:
    #     logger.info("Summarizing")
    #     next_agent = self.sub_agents[state["agent_on_duty"]]  # type: ignore
    #     state["messages"] = state["messages"][:-1]
    #     response = await next_agent(state, remove_tool_msgs=False)
    #     return {**response, "running_summary": ""}

    async def validate_state(self, state: AgentState, config: RunnableConfig) -> Dict:
        configurable = config.get("configurable", {})
        patient_id = configurable.get("patient_id")
        if not patient_id:
            raise ValueError("User ID not found in config")

        logger.info("Validating data collected")
        agent_on_duty: str = state["agent_on_duty"]  # type: ignore
        messages = state["messages"]
        previous_patient_data = state.get("patient_history")
        if not previous_patient_data:
            previous_patient_data = {}

        current_data = await self.output_parser.ainvoke(messages[-1])

        try:
            data_to_date = {
                agent_on_duty: current_data["args"],
                **previous_patient_data,
            }
            complete_data = PatientHistory(**data_to_date)
            agent_index = self.agent_names.index(agent_on_duty)

            await self.update_database(agent_on_duty, current_data["args"], patient_id)

            return {
                "patient_history": json.loads(
                    complete_data.json(exclude_none=True, exclude_unset=True)
                ),
                "passed": True,
                "agent_n_message": len(messages),
                "conclude": agent_on_duty == self.agent_names[-1],
                "agent_on_duty": self.get_next_agent(agent_index),
            }
        except ValidationError as e:
            logger.error(f"Error validating state: {e}")
            return {
                "messages": [
                    ToolMessage(
                        content=f"Incomplete data. Please ask the patient for missing field. {e}",
                        tool_call_id=current_data["id"],
                    )
                ],
                "passed": False,
            }

    async def update_database(self, agent_on_duty, current_data, patient_id):
        with self.db as session:
            patient_data = await get_static_patient_data(session, patient_id)
            if agent_on_duty in [
                "personal_information",
                "family_history",
                "social_history",
            ]:
                if not getattr(patient_data, agent_on_duty):
                    setattr(
                        patient_data,
                        agent_on_duty,
                        self.db_models[agent_on_duty](**current_data),
                    )
                    session.add(patient_data)
            else:
                data = self.db_models[agent_on_duty](
                    **current_data, patient_id=patient_id
                )
                session.add(data)
            session.commit()

    def get_next_agent(self, agent_index):
        if agent_index < len(self.agent_names) - 1:
            return self.agent_names[agent_index + 1]
        return "conclude_conversation"

    # def delete_messages(self, state: AgentState) -> Dict:
    #     passed = state["passed"]
    #     if passed:
    #         messages = [
    #             msg for msg in state["messages"] if not isinstance(msg, RemoveMessage)
    #         ]
    #         return {"messages": [RemoveMessage(id=m.id) for m in messages[-2:]]}
    #     return {}

    # def should_summarize(self, state: AgentState) -> str:
    #     passed = state.get("passed")
    #     if passed and not state.get("conclude"):
    #         return "summary"
    #     elif state.get("conclude"):
    #         return "conclude_conversation"
    #     return state["agent_on_duty"]  # type: ignore[return-value]

    async def entry_point_fn(self, state: AgentState) -> str:
        for name in self.sub_agents:
            if not state.get("patient_history", {}).get(name):  # type: ignore
                logger.info(f"{name}")
                return name
        return "conclude_conversation"

    def should_validate(self, state: AgentState) -> str:
        logger.info("Should validate")
        if res := self.output_parser.invoke(state["messages"][-1]):
            logger.info(f"{res}")
            return "engine"
        logger.info("Don't validate")
        return END

    async def conclude_conversation(self, state: AgentState) -> Dict:
        fake_llm = FakeStreamingListLLM(
            responses=[
                "Thank you for your time. All your responses have been recorded. Goodbye."
            ]
        ).with_config({"tags": ["conclude"]})
        response = await fake_llm.ainvoke(state["messages"])
        return {"messages": [AIMessage(content=response)]}
