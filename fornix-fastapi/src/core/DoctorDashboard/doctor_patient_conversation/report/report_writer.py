from itertools import chain
from .prompt import TRANSCRIPT_CLEANING_PROMPT
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.runnables import (
    Runnable,
    RunnablePassthrough,
    RunnableLambda,
)
from langchain_core.output_parsers import JsonOutputToolsParser
from .output_schemas import Transcript, PatientHistory
from .prompt import REPORT_PROMPT_TEMPLATE
from ..utils import batched


class PatientReportCreator:
    def __init__(
        self,
        llm: BaseChatModel,
        chunk_size: int = 4000,
        chunk_overlap: int = 0,
        return_raw: bool = False,
    ) -> None:
        self.llm = llm
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.return_raw = return_raw
        self.prompt = ChatPromptTemplate.from_template(REPORT_PROMPT_TEMPLATE)
        self.output_schema = PatientHistory
        self.text_splitter = RecursiveCharacterTextSplitter(
            separators=["\n", " ", ""],
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
        )
        self.chain = self.full_chain(return_raw=self.return_raw)

    def get_speakers_chain(self) -> Runnable:
        return (
            ChatPromptTemplate.from_template(TRANSCRIPT_CLEANING_PROMPT)
            | self.llm.bind_tools([Transcript], tool_choice=Transcript.__name__)
            | JsonOutputToolsParser(first_tool_only=True)
            | (lambda x: x["args"])
        )

    def report_chain(self):
        chain = self.prompt | self.llm.with_structured_output(PatientHistory)
        return chain.with_config(config={"tags": ["analysis"]})

    def full_chain(self, return_raw: bool = False) -> Runnable:
        if return_raw:
            return (
                RunnableLambda(self.text_splitter.split_text)
                | self.get_speakers_chain().map()
                | {
                    "transcript": (
                        lambda x: list(
                            chain.from_iterable([chunk["messages"] for chunk in x])
                        )
                    )
                    | RunnableLambda(lambda x: list(batched(x, 2)))
                    | RunnableLambda(
                        lambda x: "\n\n".join(
                            [
                                "\n".join([f"{z['speaker']}: {z['text']}" for z in y])
                                for y in x  # type: ignore
                            ]
                        )
                    ).with_config(config={"tags": ["cleaner"]})
                }
                | {
                    "report": self.report_chain(),
                    "transcript": RunnablePassthrough(),
                }
            )
        else:
            return (
                RunnableLambda(
                    lambda x: "\n\n".join(
                        ["\n".join(y) for y in batched(str(x).split("\n"), 2)]
                    )
                )
                | self.report_chain()
            )

    def __call__(self, transcript: str):
        return self.chain.astream_events(transcript, version="v2")
