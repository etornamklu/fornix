from dotenv import load_dotenv
from langchain.schema import StrOutputParser
from langchain.schema.runnable import Runnable
from typing import Dict
from langchain.prompts import (
    ChatPromptTemplate,
)
from langchain_openai.chat_models import ChatOpenAI
from langchain.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)

load_dotenv()


class BaseDashboard:
    def __init__(self, system_messages: Dict, human_messages: Dict) -> None:
        self._system_messages = system_messages
        self._human_messages = human_messages

    @property
    def system_messages(self):
        return self._system_messages

    @property
    def human_messages(self):
        return self._human_messages

    def prompt_template(self, system_msg: str, human_msg: str):
        prompt = ChatPromptTemplate.from_messages(
            messages=[
                SystemMessagePromptTemplate.from_template(system_msg),
                HumanMessagePromptTemplate.from_template(human_msg),
            ]
        )
        return prompt

    def chain_builder(self, llm: ChatOpenAI, output_key, **kwargs):
        system_msg = self._system_messages[output_key]
        human_msg = self._human_messages[output_key]
        prompt = self.prompt_template(system_msg, human_msg)
        chain: Runnable = prompt | llm.bind(**kwargs) | StrOutputParser()
        return chain
