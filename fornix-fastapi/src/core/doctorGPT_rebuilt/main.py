
# FILE NOT USED IN THE PROJECT

# from collections import defaultdict
# from contextlib import asynccontextmanager
# import json
# import os
# from typing import Any, AsyncGenerator
# from typing import List
# from typing import Literal, Dict
# from uuid import uuid4
# from dotenv import load_dotenv
# from fastapi import FastAPI, HTTPException, Response
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from langchain_community.chat_message_histories.sql import SQLChatMessageHistory
# from langchain_core.messages import HumanMessage, AIMessage
# from langchain_core.runnables.history import RunnableWithMessageHistory
# from langchain_openai.chat_models import ChatOpenAI
# from loguru import logger
# from pydantic import BaseModel
# import asyncio
# from langchain.chat_models import init_chat_model
# from sse_starlette import EventSourceResponse
# from src.core.doctorGPT_rebuilt.workflow.agent import AgentWorkflow
# from src.core.constants import MEDICAL_DOMAINS
# from src.core.doctorGPT_rebuilt.workflow.tools import TavilySearchEngineTool
# from src.controller.stream_response import StreamEventHandler
# from .utils import on_chat_model_stream, on_chain_stream

# load_dotenv(override=True)


# @asynccontextmanager
# async def lifespan(_app: FastAPI) -> Any:
#     logger.info("beginning lifespan")
#     search_engine = TavilySearchEngineTool(
#         include_answer=False,  # include Tavily AI's answer in addition to the search results. IT INCREASES LATENCY!
#         include_source=True,
#         include_domains=MEDICAL_DOMAINS,  # TODO: add more domains or remove if not needed!
#         max_results=3,  # Can be increased or decreased based on the requirements
#     )
#     # llm = ChatOpenAI(model=os.getenv("LLM", "gpt-4o-2024-08-06"), streaming=True, stream_usage=True)
#     llm = init_chat_model(os.getenv("LLM"), model_provider="openai", streaming=True, stream_usage=True)
#     graph = AgentWorkflow(llm=llm, tools=[search_engine])
#     agent = RunnableWithMessageHistory(
#         runnable=graph.graph,
#         input_messages_key="messages",
#         history_messages_key="chat_history",
#         output_messages_key="agent_outcome",
#         get_session_history=lambda session_id: SQLChatMessageHistory(
#             session_id=session_id,
#             connection_string="sqlite:///chat_history.db",
#             table_name="chat_history",
#         ),
#     ).with_types(input_type=HumanMessage, output_type=AIMessage)
#     _app.state.agent = agent

#     yield
#     logger.info("ending lifespan")


# app = FastAPI(lifespan=lifespan)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# class Message(BaseModel):
#     content: str | List[str | Dict]
#     additional_kwargs: dict = {}
#     response_metadata: dict = {}
#     type: Literal["human"] = "human"
#     name: str | None = None
#     id: str | None = None
#     example: bool = False


# @app.post("/chat/{session_id}")
# async def query(response: Response, message: Message, session_id: str):
#     try:
#         stream_handler = StreamEventHandler(
#             on_chat_model_stream, on_chain_stream=on_chain_stream
#         )
#         async_iterator = app.state.agent.astream_events(
#             {"messages": [HumanMessage(**message.model_dump())]},
#             version="v2",
#             config={"configurable": {"session_id": session_id}},
#         )

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     else:
#         return EventSourceResponse(
#             stream_handler.stream_llm_response(async_iterator),
#             media_type="text/event-stream",
#         )


# if __name__ == "__main__":
#     import uvicorn

#     uvicorn.run(app, port=8000)
