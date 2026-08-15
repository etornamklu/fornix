import asyncio
from typing_extensions import deprecated
import requests
from typing import Any, Literal, Optional, Type

import aiohttp
from dotenv import load_dotenv

from langchain.utils.env import get_from_dict_or_env
from langchain_community.tools.ddg_search import DuckDuckGoSearchRun
from langchain_core.callbacks import (
    AsyncCallbackManagerForToolRun,
    CallbackManagerForToolRun,
)
from langchain_core.tools import BaseTool
from pydantic import (
    BaseModel,
    model_validator,
    Field,
)
from src.libraries.config import get_settings

load_dotenv()


@deprecated("This tool is deprecated. Use the TavilySearchEngineTool instead.")
class CustomDDGSearch(DuckDuckGoSearchRun):
    def _run(
        self, query: str, run_manager: CallbackManagerForToolRun | None = None
    ) -> str:
        results = self.api_wrapper.results(query, max_results=3)
        results_ = [f"{result['snippet']}\n{result['link']}" for result in results]
        return "\n\n".join(results_)

    async def _arun(self, *args: Any, **kwargs: Any):
        return await asyncio.to_thread(self._run, *args, **kwargs)


class InputSchema(BaseModel):
    query: str = Field(..., description="The query to the search engine.")


class TavilySearchEngineTool(BaseTool):
    name: str = "search_engine"
    description: str = (
        "A search engine optimized for real-time medical answers, taking a search query and returning the top results."
    )
    include_answer: bool = False
    include_source: bool = True
    tavily_api_key: str | None = Field(None, repr=False)
    max_results: int = 4
    topic: Literal["general", "news"] = "general"
    include_domains: list = []
    exclude_domains: list = []
    args_schema: Type[BaseModel] | None = InputSchema
    _validated_payload: dict = {}

    @model_validator(mode="before")
    @classmethod
    def validate_and_transform(cls, values):
        if not (tavily_api_key := values.get("tavily_api_key")):
            tavily_api_key = get_from_dict_or_env(
                values, "tavily_api_key", "TAVILY_API_KEY"
            )
        if not tavily_api_key:
            raise ValueError("Tavily API key is required.")

        values["tavily_api_key"] = tavily_api_key
        return values

    def _get_payload(self, query: str) -> dict:
        payload = {
            "api_key": self.tavily_api_key or get_settings().tavily_api_key,
            "query": query,
            "max_results": self.max_results,
            "topic": self.topic,
            "include_domains": self.include_domains,
            "exclude_domains": self.exclude_domains,
        }
        return payload

    def _run(
        self, query: str, run_manager: Optional[CallbackManagerForToolRun] = None
    ) -> str:

        payload = self._get_payload(query)

        TAVILY_ENDPOINT = "https://api.tavily.com/search"
        response = requests.post(TAVILY_ENDPOINT, json=payload)
        response.raise_for_status()
        return self._process_response(response.json())

    async def _arun(
        self, query: str, run_manager: Optional[AsyncCallbackManagerForToolRun] = None
    ) -> str:
        payload = self._get_payload(query)
        TAVILY_ENDPOINT = "https://api.tavily.com/search"
        async with aiohttp.ClientSession() as session, session.post(
            TAVILY_ENDPOINT, json=payload
        ) as response:
            response.raise_for_status()
            return self._process_response(await response.json())

    def _process_response(self, response: dict) -> str:
        if self.include_answer:
            if self.include_source:
                return (
                    response["answer"]
                    + "\n"
                    + "\n\n".join(
                        [
                            f"{result['content']}\nsource: {result['url']}"
                            for result in response["results"]
                        ]
                    )
                )
            else:
                return (
                    response["answer"]
                    + "\n"
                    + "\n\n".join([result["content"] for result in response["results"]])
                )
        else:
            if self.include_source:
                return "\n\n".join(
                    [
                        f"{result['content']}\nsource: {result['url']}"
                        for result in response["results"]
                    ]
                )
            else:
                return "\n\n".join(
                    [result["content"] for result in response["results"]]
                )