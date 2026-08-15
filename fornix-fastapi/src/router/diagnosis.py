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
from src.controller.diagnosis import summary_event_gen, diagnosis_from_summary_event_gen, clinical_diagnosis
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
from src.database.database_connection import get_db
from src.libraries.config import get_settings
from src.services.redis import get_transcribed_text_from_cache, delete_cache
from src.utils.types import ClinicalCompletionRequestBody

router = APIRouter()
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


@router.post("/summary", dependencies=[Depends(doctor_decode_token)])
async def get_patient_summary(
    patient_info: PatientDataMod,
    # __token: Annotated[TokenData, Depends(doctor_decode_token)],   Include in decorator if return data is not used
    *,
    # patient_id: str,
    db: Session = Depends(get_db),
):
    """endpoint for creating patient summary"""
    try:
        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)

        event_gen = summary_event_gen(patient_info)

        # if patient_id:
        # TODO: why this?
        # for storing patient generated summary
        # Simply make patient_id a required parameter

        # await asyncio.create_task(
        #     save_patient_summary(patient_id, patient_info, db, dashboard)   # LLM called twice for one summary
        # )
        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/summary/voice", dependencies=[Depends(doctor_decode_token)])
async def get_summary_from_voice(
        file: UploadFile,
        audio_id: str | None = None,
        db: Session = Depends(get_db),
):
    try:
        logger.info(f"Received Audio with size: {file.size * 0.000001} mb, type: {file.content_type}")
        raw_audio_bytes = await file.read()
        audio_data = BytesIO(raw_audio_bytes)
        audio_data.name = file.filename

        cached_data = ""
        if audio_id:
            cached_data = get_transcribed_text_from_cache(audio_id)
            delete_cache(audio_id)

        data = cached_data + await process_audio_chunks(audio_data)
        logger.info(f"audio data: {data}")

        structured_llm = llm.with_structured_output(PatientDataMod)
        patient_info = structured_llm.invoke(FORMAT_DOCTOR_NOTES.format(data=data))

        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)

        event_gen = summary_event_gen(PatientDataMod(**patient_info))
        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))


    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/summary/report/{report_id}" ,dependencies=[Depends(doctor_decode_token)])
async def get_patient_medical_notes_summary(
    report_id: str,
    *,
    db: Session = Depends(get_db),
):
    """endpoint for creating patient summary"""
    try:
        report = db.query(DoctorReport).where(DoctorReport.id == report_id).first()
        if not report:
            logger.error(f"Report not found for ID: {report_id}")
            raise HTTPException(status_code=404, detail="Report not found")

        medical_notes = report.content.get("medical_notes", {})

        messages = [
            HumanMessage(content=MEDICAL_HISTORY_SUMMARY_WRITER.format(**{"patient_data": medical_notes}))
        ]
        chain = (
            llm.bind_tools(
                tools=[SummarySchema], tool_choice=SummarySchema.__name__
            ).with_config(config={"tags": ["analysis"]})
            | JsonOutputToolsParser(first_tool_only=True)
            | (lambda x: SummarySchema(**x["args"]))
        )

        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)

        event_gen = chain.astream_events(
            messages, version="v2", include_tags=["analysis"]
        )

        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))

    except HTTPException as hx:
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/diagnose", dependencies=[Depends(doctor_decode_token)])
async def get_diagnosis_from_summary(
    summary: str = Body(..., embed=True),
    # __token: Annotated[TokenData, Depends(doctor_decode_token)],   Include in decorator if return data is not used
):
    """endpoint for streaming fornix ai diagnosis from patient summary"""
    try:
        stream_handler = StreamEventHandler(on_chat_model_stream=stream_async_iterator)

        event_gen = diagnosis_from_summary_event_gen(summary)

        return EventSourceResponse(stream_handler.stream_llm_response(event_gen))

    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# deprecated
# @router.post("/diagnose/stream", deprecated=True)
# async def get_diagnosis(
#         patient_data: PatientDataMod,
#         token: Annotated[TokenData, Depends(doctor_decode_token)],
# ):
#     """endpoint for streaming fornix ai diagnosis result"""
#     try:
#         summary = ""
#         async for token in dashboard.get_summary(patient_data.model_dump()):
#             tk = token
#             summary = summary + str(tk)
#
#         return EventSourceResponse(
#             dashboard.get_diagnosis_completion({"summary": summary})
#         )
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e)) from e


# deprecated
# @router.post("/diagnose/clinical/init", deprecated=True)
# async def get_clinical_diagnosis(
#         body: ClinicalCompletionRequestBody,
#         token: Annotated[TokenData, Depends(doctor_decode_token)],
# ):
#     """endpoint for starting diagnosis"""
#     try:
#         patient_data = body.patient_data
#         key = body.key
#         summary = ""
#         async for token in dashboard.get_summary(patient_data.model_dump()):
#             tk = token
#             summary = summary + str(tk)
#
#         diagnosis = ""
#         async for token in dashboard.get_diagnosis_completion({"summary": summary}):
#             tk = token
#             diagnosis = diagnosis + str(tk)
#
#         diagnosis_json = diagnosis_completion_response_to_json(diagnosis)
#         conditions = {
#             "conditions": summary
#                           + " The patient's most likely diagnosis is "
#                           + diagnosis_json["diagnosis"]["most_likely"]
#                           + " The patient's most likely diagnosis is "
#                           + diagnosis_json["diagnosis"]["most_likely"]
#         }
#
#         return EventSourceResponse(
#             dashboard.get_clinical_completion(conditions, key=key)
#         )
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/diagnose/clinical", dependencies=[Depends(doctor_decode_token)])
async def get_clinical_diagnosis_base(
    body: ClinicalCompletionRequestBody,
    # __token: Annotated[TokenData, Depends(doctor_decode_token)],  Include in decorator if return data is not used
):
    """endpoint for making diagnosis with less control"""
    try:
        return clinical_diagnosis(body)

    except HTTPException as hx:
        logger.error(str(hx))
        raise hx
    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
