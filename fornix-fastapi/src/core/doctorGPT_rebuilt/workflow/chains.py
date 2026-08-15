from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel
from langchain_core.language_models import BaseChatModel
from typing import Optional, Type
from langchain_core.runnables import Runnable
from langchain_core.output_parsers import StrOutputParser
from .prompts import GREETINGS_PROMPT, RAG_TOOL_PROMPT


# from .schemas import ResponseFormat


def llm_chain(
    llm: BaseChatModel,
    prompt_template: str,
    output_schema: Optional[Type[BaseModel]] = None,
) -> Runnable:
    """
    Create a language model chain with a given prompt template and output schema.

    Args:
        llm (BaseChatModel): The language model to use in the chain.
        prompt_template (str): The template for the prompt to use in the chain.
        output_schema (Optional[Type[BaseModel]], optional): The output schema for the chain. Defaults to None.

    Returns:
        Runnable: The language model chain.
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", prompt_template),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            MessagesPlaceholder(variable_name="messages", optional=True),
        ]
    )
    return prompt | (
        llm
        if output_schema is None
        else llm.bind_tools(tools=[output_schema], tool_choice=output_schema.__name__)
    )
    #  | (
    #         StrOutputParser()
    #         if output_schema is None
    #         else JsonOutputToolsParser(return_id=True)
    # | RunnableBranch(
    #     (lambda x: isinstance(x, list), lambda x: output_schema(**x[0]["args"])),
    #     lambda x: x,
    # )
    # )


def rag_chain(llm: BaseChatModel, system_prompt: str = "") -> Runnable:
    prompt_template = system_prompt or RAG_TOOL_PROMPT
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", prompt_template),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            MessagesPlaceholder(variable_name="messages", optional=True),
        ]
    )
    return prompt | llm  # | StrOutputParser()


# .with_structured_output(
#         schema=schema or ResponseFormat, method="json_mode"
#     )


def generic_chain(llm: BaseChatModel, system_prompt: str = "") -> Runnable:
    """
    Create a fallback language model chain with a generic prompt template.

    Args:
        llm (BaseChatModel): The language model to use in the chain.

    Returns:
        Runnable: The generic language model chain.
    """
    system_prompt = system_prompt or GREETINGS_PROMPT
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )
    return prompt | llm | StrOutputParser()
