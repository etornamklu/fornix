from langchain_core.messages import BaseMessage
from typing import Dict, TypedDict, List, Annotated, Union
from operator import add


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add]

    patient_history: Union[Dict, None]

    agent_on_duty: Union[str, None]
    agent_n_message: Union[int, None]
    passed: Union[bool, None]
    
    is_existing_patient: Union[bool, None]
    last_seen: Union[str, None]
    latest_chief_complaint: Union[str, None]

    conclude: Union[bool, None]


class OutputSchema(TypedDict):
    messages: List[BaseMessage]
    patient_history: Union[Dict, None]
    agent_on_duty: str
    conclude: bool
