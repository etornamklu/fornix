from typing import Any, Dict, List, Type, TYPE_CHECKING
from uuid import uuid4
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import (
    SystemMessage,
    BaseMessage,
    AIMessage,
    ToolMessage,
    HumanMessage,
)
from langchain_core.pydantic_v1 import BaseModel, ValidationError
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
from langchain_core.messages.utils import trim_messages
from loguru import logger
from datetime import datetime, UTC

from ..prompts.prompts import (
    EXISTING_PATIENT_TEMPLATE,
    NEW_PATIENT_TEMPLATE,
)


if TYPE_CHECKING:
    from .state import AgentState


class SubAgent:
    def __init__(
        self,
        llm: BaseChatModel,
        system_prompt: str,
        output_schemas: List[Type[BaseModel]],
        name: str,
        default_ai_message: str,
    ):
        self.system_prompt = system_prompt
        self.output_schemas = output_schemas
        self.llm = llm.bind_tools(tools=self.output_schemas)
        self.name = name
        self.default_ai_message = default_ai_message

    async def __call__(self, state: "AgentState") -> Dict:
        messages = state["messages"].copy()
        messages = await self._filter_messages(messages)
        input_messages: List[BaseMessage] = [
            HumanMessage(content="Hi Doctor!", id=str(uuid4())),
            AIMessage(content=self.default_ai_message, id=str(uuid4())),
        ]

        if self.system_prompt:
            dt = datetime.now(UTC).strftime(
                "%A, %d %B %Y %H:%M:%S %Z (Day %j, Week %U)"
            )
            if not (patient_history := state.get("patient_history")):
                input_messages.insert(
                    0, SystemMessage(content=self.system_prompt.format(date_time=dt))
                )
            else:
                chief_complaint = patient_history.get("chief_complaint", {})
                hpc = chief_complaint.get("hpc", {})
                hpc_dict = {
                    "chief_complaint": chief_complaint.get("presenting_complaints", []),
                }
                for key in ["site", "onset", "character", "severity"]:
                    hpc_dict[key] = hpc.get(key, "")
                personal_information = state["patient_history"]["personal_information"]  # type: ignore
                gender = personal_information["gender"]  # type: ignore
                input_messages.insert(
                    0,
                    SystemMessage(
                        content=self.system_prompt.format(
                            date_time=dt,
                            gender=gender,
                            age=self._calculate_age(
                                personal_information["date_of_birth"]
                            ),
                            **hpc_dict,
                        )
                    ),
                )

        input_messages.extend(messages)
        input_messages = trim_messages(
            input_messages,
            max_tokens=2000,
            strategy="last",
            token_counter=self.llm,
            include_system=True,
        )
        # logger.debug(f"Input messages: {input_messages}")
        response = await self.llm.ainvoke(input_messages)
        return {"messages": [response], "agent_on_duty": self.name, "passed": False}

    async def _filter_messages(self, messages: List[BaseMessage]) -> List[BaseMessage]:
        parser = JsonOutputToolsParser(first_tool_only=True, return_id=True)
        filtered_messages = []
        i = 0
        while i < len(messages):
            if isinstance(messages[i], AIMessage) and await parser.ainvoke(messages[i]):
                if i == len(messages) - 1 or not isinstance(
                    messages[i + 1], ToolMessage
                ):
                    i += 1
                    continue
            filtered_messages.append(messages[i])
            i += 1
        return filtered_messages

    def validate_schema(self, data: Dict) -> Any:
        for schema in self.output_schemas:
            try:
                return schema(**data)
            except ValidationError as e:
                logger.error(f"Error validating schema {schema}: {e}")
                raise ValueError(f"Error validating schema {schema}: {e}")

    def _calculate_age(self, dob_str: str) -> int:
        date_of_birth = datetime.strptime(dob_str, "%Y-%m-%d")
        current_date = datetime.now()
        age = (
            current_date.year
            - date_of_birth.year
            - (
                (current_date.month, current_date.day)
                < (date_of_birth.month, date_of_birth.day)
            )
        )

        return age

    def __repr__(self):
        return f"<SubAgent name={self.name}>"

    def __str__(self):
        return self.__repr__()


class ChiefComplainAgent(SubAgent):
    def __init__(
        self,
        llm: BaseChatModel,
        output_schemas: List[Type[BaseModel]],
        name: str,
        default_ai_message: str,
    ):
        super().__init__(llm, "", output_schemas, name, default_ai_message)

    async def __call__(self, state: "AgentState") -> Dict:
        is_existing_patient = state["is_existing_patient"]
        personal_info = state["patient_history"]["personal_information"]  # type: ignore

        if is_existing_patient:
            system_prompt = EXISTING_PATIENT_TEMPLATE.format(
                patient_name=f"{personal_info['firstname']} {personal_info['lastname']}",
                nickname=personal_info.get("nickname", "No nickname"),
                gender=personal_info.get("gender"),
                age=self._calculate_age(personal_info["date_of_birth"]),
                last_seen_date=state["last_seen"],  # type: ignore
                previous_chief_complaint=state["latest_chief_complaint"],  # type: ignore
                next_doctor="medical history specialist",
                agent_name="presenting complaints specialist",
            )
        else:
            system_prompt = NEW_PATIENT_TEMPLATE.format(
                next_doctor="medical history specialist",
                agent_name="presenting complaints specialist",
            )

        self.system_prompt = system_prompt
        return await super().__call__(state)
