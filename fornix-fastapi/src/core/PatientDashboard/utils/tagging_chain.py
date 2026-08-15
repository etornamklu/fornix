from typing import Any, Optional
from langchain.chains.openai_functions.utils import _convert_schema
from langchain.output_parsers.openai_functions import PydanticOutputFunctionsParser
from langchain.prompts import ChatPromptTemplate
from langchain.schema.language_model import BaseLanguageModel
from langchain.schema.runnable import Runnable

from dotenv import load_dotenv

load_dotenv()


def _get_tagging_function(schema: dict) -> dict:
    return {
        "name": "information_extraction",
        "description": "Extracts the relevant information from the patient's message.",
        "parameters": _convert_schema(schema),
    }


_TAGGING_TEMPLATE = """
Extract the desired information from the patient's response to the question below.

Only extract the properties mentioned in the 'information_extraction' function.
DO NOT include anything that is not mentioned in the patient's response.
Ensure brevity for efficient storage in the database. For instance, if the patient mentions "symptoms: I don't have any particular symptoms," write "No symptoms" instead of the entire sentence.
Do not include greetings in the json schema.
Always try to correct spellings.

Question on {key}:
{question}

Patient's response:
{input}
"""


def pydantic_tagging_chain(
    llm: BaseLanguageModel,
    schema,
    prompt: Optional[ChatPromptTemplate] = None,
    **kwargs: Any,
) -> Runnable:
    openai_schema = schema.schema()
    function = _get_tagging_function(openai_schema)
    prompt = prompt or ChatPromptTemplate.from_template(_TAGGING_TEMPLATE)
    output_parser = PydanticOutputFunctionsParser(pydantic_schema=schema)
    chain = (
        prompt
        | llm.bind(
            function_call={"name": "information_extraction"},
            functions=[function],
            **kwargs,
        )
        | output_parser
    )

    return chain
