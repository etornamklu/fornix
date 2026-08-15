# from __future__ import annotations

# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.responses import StreamingResponse
# from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel
from typing import List, Optional
# from langchain_openai.chat_models import ChatOpenAI
# from langchain_core.messages import HumanMessage, SystemMessage

# from .prompt import QUERY_WRITER

# # from src.core.DoctorDashboard.diagnosis.schemas import SummarySchema
# from .utils import stream_async_iterator
# from .workflow import DiagnosisWorkflow

# app = FastAPI()


# def get_llm() -> BaseChatModel:
#     return ChatOpenAI(model="gpt-4o", temperature=0.0)


class PatientInfo(BaseModel):
    age: str
    sex: str
    complaint_and_duration: str
    symptoms_history: Optional[List[str] | str]
    med_history: Optional[str] = None
    social_family_history: Optional[str] = None
    clinical_studies: Optional[List[str] | str] = None
    other_info: Optional[str] = None


# class PatientSummary(BaseModel):
#     summary: str


# #
# # @app.post("/summary")
# # async def patient_history_summmary(
# #         patient_info: PatientInfo, llm: BaseChatModel = Depends(get_llm)
# # ):
# #     messages = [
# #         HumanMessage(content=SUMMARY_WRITER.format(**patient_info.model_dump()))
# #     ]
# #     chain = (
# #             llm.bind_tools(
# #                 tools=[SummarySchema], tool_choice=SummarySchema.__name__
# #             ).with_config(config={"tags": ["analysis"]})
# #             | JsonOutputToolsParser(first_tool_only=True)
# #             | (lambda x: SummarySchema(**x["args"]))
# #     )
# #     try:
# #         event_gen = chain.astream_events(
# #             messages, version="v2", include_tags=["analysis"]
# #         )
# #         return StreamingResponse(
# #             stream_async_iterator(event_gen), media_type="text/event-stream"
# #         )
# #     except Exception as e:
# #         logger.error(repr(e))
# #         raise HTTPException(
# #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
# #         )
# #
# #
# # @app.post("/diagnose-stream")
# # async def diagnose_stream(
# #     summary: PatientSummary, llm: BaseChatModel = Depends(get_llm)
# # ):
# #     try:
# #         workflow = DiagnosisWorkflow(llm)

# #         messages = [
# #             SystemMessage(content=QUERY_WRITER),
# #             HumanMessage(content=f"```\n{summary.summary}\n```"),
# #         ]

# #         event_gen = workflow.graph.astream_events(
# #             messages, version="v2", include_tags=["analysis"]
# #         )

# #         return StreamingResponse(
# #             stream_async_iterator(event_gen), media_type="text/event-stream"
# #         )
# #     except Exception as e:
# #         raise HTTPException(status_code=500, detail=str(e))


# # if __name__ == "__main__":
# #     import uvicorn

# #     uvicorn.run(app, host="localhost", port=5000)
