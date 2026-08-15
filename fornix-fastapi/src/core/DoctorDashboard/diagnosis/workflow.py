import asyncio
from typing import List

import aiohttp
from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableParallel
from langgraph.graph import END
from langgraph.graph.message import MessageGraph
from langgraph.graph.message import MessagesState

from src.core.DoctorDashboard.diagnosis.prompt import ANALYSIS_WRITER
from src.core.DoctorDashboard.diagnosis.schemas import (
    SearchQuerySchema,
    DiagnosticModel,
)
from src.libraries.config import get_settings


# from ...constants import MEDICAL_DOMAINS


class DiagnosisWorkflow:
    def __init__(self, llm: BaseChatModel):
        self.llm = llm
        self.output_parser = JsonOutputToolsParser(first_tool_only=True)
        graph = MessageGraph()
        graph.add_node("query", self.queries_writer(llm))
        graph.add_node("action", self.action)
        graph.add_node("analysis", self.analyze(llm))
        graph.set_entry_point("query")
        graph.add_edge("query", "action")
        graph.add_edge("action", "analysis")
        graph.add_edge("analysis", END)
        self.graph = graph.compile()

    def queries_writer(self, llm: BaseChatModel):
        chain = llm.bind_tools(
            tools=[SearchQuerySchema], tool_choice=SearchQuerySchema.__name__
        )
        return chain.with_config({"tags": ["query"]})

    async def action(self, state: MessagesState):
        tool_output = (await self.output_parser.ainvoke(state[-1]))["args"]  # type: ignore

        async def fetch_query(session: aiohttp.ClientSession, query) -> List:
            start = "What is the differential OR most likely diagnosis for {}"
            payload = {
                "api_key": get_settings().tavily_api_key,
                "query": start.format(query),
                "search_depth": "advanced",
                "max_results": 4,
                "include_answer": False,
                # "include_domains": MEDICAL_DOMAINS
                # **kwargs,
            }
            try:
                async with session.post(
                        "https://api.tavily.com/search", json=payload
                ) as response:
                    response.raise_for_status()
                    results = await response.json()
                    return results["results"]
            except Exception as e:
                print(e)
                pass

        async with aiohttp.ClientSession() as session:
            tasks = [
                fetch_query(session, query) for query in tool_output["search_queries"]
            ]
            results = await asyncio.gather(*tasks)
            if results is None:
                return ""
            print('----------RESULTS--------------')
            print(results)
            print('----------RESULTS END--------------')

            results = [
                (f'{obj["title"]}: {obj["content"]}', obj["score"])
                for group in results
                if group  # skip None or empty groups
                for obj in group
                if obj and obj.get("title")  # skip None objs or missing title/content
                   and obj.get("content")
            ]

            results = sorted(results, key=lambda x: x[-1], reverse=True)
            results_with_greater_than_0_3_score = list(
                filter(lambda x: x[-1] > 0.4, results)
            )
            results = list(map(lambda x: f"{x[0]}\nScore: {x[-1]}", results_with_greater_than_0_3_score))
            results = "----CONTEXT----\n" + "\n\n".join(list(results))
            return results

    def analyze(self, llm: BaseChatModel):
        prompt = PromptTemplate.from_template(ANALYSIS_WRITER)
        chain = (
                RunnableParallel(
                    {
                        "patient_history": lambda x: x[1].content.strip("```"),  # type: ignore
                        "context": lambda x: x[-1].content,  # type: ignore
                    }
                )
                | prompt
                | llm.bind_tools(
            tools=[DiagnosticModel], tool_choice=DiagnosticModel.__name__
        )
        )
        return chain.with_config({"tags": ["analysis"]})
