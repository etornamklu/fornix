import re
from typing import Dict, Optional, Set, TypedDict, Union, Annotated, List
from operator import add
from .chains import llm_chain, generic_chain
from .schemas import InputClassification, MedicalResponse
from langchain_core.messages import BaseMessage, AIMessage, ToolMessage
from langgraph.prebuilt import ToolExecutor, ToolInvocation
from langgraph.graph import StateGraph, END
from langchain_core.tools import BaseTool
from collections import defaultdict
import json
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
from langchain_community.llms.fake import FakeStreamingListLLM
from loguru import logger
from .utils import async_time_logger
from .prompts import (
    INITIAL_EVALUATION,
    RAG_TOOL_PROMPT,
    UNRELATED_QUERIES_MESSAGE,
)



class AgentState(TypedDict):

    messages: Annotated[list[BaseMessage], add]
    chat_history: list[BaseMessage]
    doctor_query: Optional[str]
    agent_outcome: Union[AIMessage, None]


class AgentWorkflow:
    def __init__(self, llm, tools: List[BaseTool]) -> None:
        # self.chains = partial(llm_chain, llm=llm)
        self._initial_evaluation_chain = llm_chain(
            llm=llm,
            prompt_template=INITIAL_EVALUATION,
            output_schema=InputClassification,
        )
        # self._search_queries_chain = llm_chain(
        #     llm=llm,
        #     prompt_template=SEARCH_QUERIES_PROMPT,
        #     output_schema=SearchQueryOutput,
        # )
        self._rag_chain = llm_chain(
            llm=llm, prompt_template=RAG_TOOL_PROMPT, output_schema=MedicalResponse
        )
        self._generic_chain = generic_chain(llm)
        self.tool_executor = ToolExecutor(tools=tools)
        self.output_parser = JsonOutputToolsParser(return_id=True)
        graph = StateGraph(AgentState)
        # graph.add_node("search_engine", self.search_engine_node)
        graph.add_node("rag", self.rag_node)
        graph.add_node("generic", self.generic_node)
        # graph.add_node("queries_writer", self.queries_writer_node)
        graph.add_node(
            "fallback",
            self.unrelated_query_node,
        )
        graph.set_conditional_entry_point(
            self.initial_evaluation_node,
            {
                "medically-related": "rag",
                "greetings": "generic",
                "personal": "generic",
                "non-medical": "fallback",
            },
        )
        # graph.add_edge("queries_writer", "search_engine")
        # graph.add_edge("search_engine", "rag")
        graph.add_edge("rag", END)
        graph.add_edge("generic", END)
        graph.add_edge("fallback", END)
        self.graph = graph.compile()

    @async_time_logger
    async def initial_evaluation_node(self, state: AgentState):
        logger.info("==Routing==")
        response = await self._initial_evaluation_chain.ainvoke(
            {"messages": state["messages"], "chat_history": state["chat_history"]}
        )

        return (await self.output_parser.ainvoke(response))[0]["args"].get(
            "evaluation", "unrelated"
        )

    # @async_time_logger
    # async def queries_writer_node(self, state: AgentState):
    #     logger.info("===Writing queries===")
    #     response = await self._search_queries_chain.ainvoke(state)
    #     return {"messages": [response]}

    @async_time_logger
    async def search_engine_node(self, state: AgentState):
        tool_calls = await self.output_parser.ainvoke(state["messages"][-1])
        tool_invocations = []
        ids = []
        for tool_call in tool_calls:
            for query in tool_call["args"]["search_queries"]:
                invocation = ToolInvocation(tool="search_engine", tool_input=query)
                tool_invocations.append(invocation)
            ids.append(tool_call["id"])

        logger.info("===searching the web===")
        outputs = await self.tool_executor.abatch(
            tool_invocations, return_exceptions=True
        )

        # Check if the output is a list of exceptions
        if all(isinstance(output, Exception) for output in outputs):
            logger.error(f"An error occurred while searching the web. {outputs}")
            raise ExceptionGroup("An error occurred while searching the web.", outputs)

        elif any(isinstance(output, Exception) for output in outputs):
            outputs = [
                output for output in outputs if not isinstance(output, Exception)
            ]
            tool_invocations = [
                invocation
                for invocation, output in zip(tool_invocations, outputs)
                if not isinstance(output, Exception)
            ]
            ids = [
                id_
                for id_, output in zip(ids, outputs)
                if not isinstance(output, Exception)
            ]
        
        links: Set[str] = set()
        output_map: Dict = defaultdict(dict)
        for id_, output, action in zip(ids * len(outputs), outputs, tool_invocations):
            search_results: List[str] = []
            matches = self._split_search_result(output)
            for match in matches:
                if match[1] not in links:
                    links.add(match[1])
                    search_results.append(f"{match[0]}\nsource: {match[1]}")
            output_map[id_][json.dumps(action.tool_input)] = "\n\n".join(search_results)

        return {
            "messages": [
                ToolMessage(content=json.dumps(output), tool_call_id=id_)
                for id_, output in output_map.items()
            ],
            "doctor_query": tool_calls[0]["args"]["doctor_query"],
        }
    

    def _split_search_result(self, search_result: str) -> List[tuple[str, str]]:
        pattern = r"(.*?)(source:\shttps?://[^\s]+)"
        matches = re.findall(pattern, search_result, re.DOTALL)
        return [(match[0].strip(), match[1].strip()) for match in matches]


    @async_time_logger
    async def rag_node(self, state: AgentState):
        logger.info("===Generating response with RAG tool===")
        try:
            response = await self._rag_chain.with_config({"tags": ["rag"]}).ainvoke(
                state
            )
            response = await self.output_parser.ainvoke(response)

            return {
                "agent_outcome": AIMessage(
                    content=response[0]["args"]["response"],
                    # response_metadata={"links": response[0]["args"]["source_links"]},
                    name="rag",
                )
            }
        except Exception as e:
            logger.error(f"An error occurred while generating the response: {e}")
            raise ValueError(f"An error occurred while generating the response: {e}")

    @async_time_logger
    async def generic_node(self, state: AgentState):
        logger.info("===Unrelated Query===")
        try:
            response = await self._generic_chain.with_config(
                config={"tags": ["generic"]}
            ).ainvoke(state)
            return {"agent_outcome": AIMessage(content=response, name="generic")}
        except Exception as e:
            raise ValueError(f"An error occurred while generating the response: {e}")

    @async_time_logger
    async def unrelated_query_node(self, state: AgentState):
        logger.info("===Unrelated Query===")
        fake_llm = FakeStreamingListLLM(
            responses=[UNRELATED_QUERIES_MESSAGE], sleep=0.01
        )
        response = await fake_llm.ainvoke(
            state["messages"], config={"tags": ["fallback"]}
        )
        return {"agent_outcome": AIMessage(content=response, name="fallback")}
