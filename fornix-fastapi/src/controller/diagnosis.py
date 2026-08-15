"""diagnosis controllers"""
from io import BytesIO
from pathlib import Path

from loguru import logger
from fastapi import APIRouter, Body, Depends, HTTPException, UploadFile
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser
from sqlalchemy.orm import Session
from sse_starlette import EventSourceResponse

from src.database.models.doctor import DoctorReport
from src.controller.auth import doctor_decode_token
from src.controller.doc_patient import process_audio_chunks
from src.controller.stream_response import StreamEventHandler
from src.core.DoctorDashboard.diagnosis.prompt import SUMMARY_WRITER, QUERY_WRITER, MEDICAL_HISTORY_SUMMARY_WRITER
from src.prompts.diagnosis import FORMAT_DOCTOR_NOTES
from src.core.DoctorDashboard.diagnosis.schemas import SummarySchema
from src.core.DoctorDashboard.diagnosis.utils import stream_async_iterator
from src.core.DoctorDashboard.diagnosis.workflow import DiagnosisWorkflow
from src.core.DoctorDashboard.lab_test_and_medications.workflow import (
    DoctorDashboardWorkflow,
)
from src.core.DoctorDashboard.patient_data_schema import PatientDataMod
from src.libraries.config import get_settings
from src.utils.types import ClinicalCompletionRequestBody

# Refactored paths using pathlib.Path
DIAGNOSIS_TEMPLATE_PATH = Path("src/core/DoctorDashboard/templates/diff_diagnosis.json")
CLINICAL_PLAN_TEMPLATE_PATH = Path(
    "src/core/DoctorDashboard/templates/clinical_plan.json"
)

settings = get_settings()

llm = init_chat_model(
    model=settings.llm,
    model_provider=settings.llm_provider,
    temperature=settings.llm_temperature,
    streaming=True,
    stream_usage=True,
)

medical_service = DoctorDashboardWorkflow(llm=llm)

def summary_event_gen(patient_info: PatientDataMod):
    """endpoint for creating patient summary"""
    try:
        messages = [
            HumanMessage(content=SUMMARY_WRITER.format(**patient_info.model_dump()))
        ]
        chain = (
                llm.bind_tools(
                    tools=[SummarySchema], tool_choice=SummarySchema.__name__
                ).with_config(config={"tags": ["analysis"]})
                | JsonOutputToolsParser(first_tool_only=True)
                | (lambda x: SummarySchema(**x["args"]))
        )

        return chain.astream_events(
            messages, version="v2", include_tags=["analysis"]
        )

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


def diagnosis_from_summary_event_gen(summary: str = Body(..., embed=True)):
    """endpoint for streaming fornix ai diagnosis from patient summary"""
    try:
        workflow = DiagnosisWorkflow(llm)

        messages = [
            SystemMessage(content=QUERY_WRITER),
            HumanMessage(content=f"```\n{summary}\n```"),
        ]

        return workflow.graph.astream_events(
            messages, version="v2", include_tags=["analysis"]
        )

    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e



def clinical_diagnosis(body: ClinicalCompletionRequestBody):
    """endpoint for making diagnosis with less control"""
    try:
        summary = body.summary
        most_likely_diagnosis = body.most_likely_diagnosis
        key = body.key

        stream_handler_for_tool = StreamEventHandler(
            on_chat_model_stream=stream_async_iterator
        )

        conditions = {
            "conditions": f"{summary}. The patient's most likely diagnosis is {most_likely_diagnosis}"
        }
        match key:
            case "msr":
                # non-pharmacological recommendations
                return EventSourceResponse(
                    stream_handler_for_tool.stream_llm_response(
                        medical_service.clinical_management(
                            conditions["conditions"]
                        )
                    )
                )
            case "non_pharm":
                # non-pharmacological recommendations
                return EventSourceResponse(
                    stream_handler_for_tool.stream_llm_response(
                        medical_service.non_pharmacological_recommendations(
                            conditions["conditions"]
                        )
                    )
                )
            case "lab":
                # lab test recommendations
                return EventSourceResponse(
                    stream_handler_for_tool.stream_llm_response(
                        medical_service.lab_test_recommendation(
                            conditions["conditions"]
                        ),
                    )
                )
            case _:
                # regular clinical keys
                # stream_handler = StreamEventHandler()
                return EventSourceResponse(
                    stream_handler_for_tool.stream_llm_response(
                        medical_service.misc_recommendations(conditions["conditions"], key=key)  # type: ignore
                    )
                )

    except HTTPException as hx:
        logger.error(str(hx))
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
