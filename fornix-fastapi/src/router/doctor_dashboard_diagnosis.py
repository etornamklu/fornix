from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy import desc
from sqlalchemy.orm import Session

from src.controller.auth import doctor_decode_token
from src.database.database_connection import get_db
from src.database.models.doctor_dashboard_diagnosis import DoctorDashboardDiagnosis
from src.database.schema.doctor_dashboard_diagnosis import (
    DoctorDashboardDiagnosisCreate,
    DoctorDashboardDiagnosisUpdate,
)
from src.database.schema.user import TokenData

router = APIRouter()


@router.post("/")
async def create_doctor_dashboard_diagnosis(
    diagnosis_data: DoctorDashboardDiagnosisCreate,
    __token: Annotated[TokenData, Depends(doctor_decode_token)],
    db: Session = Depends(get_db),
):
    try:
        # Create new instance of DoctorDashboardDiagnosis model
        new_diagnosis = DoctorDashboardDiagnosis(
            summary=diagnosis_data.summary,
            differential_diagnosis=diagnosis_data.differential_diagnosis,
            alternative_diagnoses=diagnosis_data.alternative_diagnoses,
            name=diagnosis_data.name,
            doctor_id=__token.user_id,
            patient_id=diagnosis_data.patient_id,
            clinical_items=diagnosis_data.clinical_items,
        )

        # Add to session and commit to save in database
        db.add(new_diagnosis)
        db.commit()
        db.refresh(new_diagnosis)

        return {
            "message": "Diagnosis created successfully",
            "doctor_dashboard_diagnosis": new_diagnosis,
        }

    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=str(ve))

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_all_doctor_dashboard_diagnoses(
    __token: Annotated[TokenData, Depends(doctor_decode_token)],
    db: Session = Depends(get_db),
):
    try:
        doctor_id = __token.user_id
        diagnoses = (
            db.query(DoctorDashboardDiagnosis)
            .filter_by(doctor_id=doctor_id)
            .order_by(desc(DoctorDashboardDiagnosis.updated_at))
            .all()
        )
        return diagnoses

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{diag_id}/unlink-patient")
async def unlink_patient_from_diagnosis(
    diag_id: str,
    __token: Annotated[TokenData, Depends(doctor_decode_token)],
    db: Session = Depends(get_db),
):
    try:
        diagnosis = db.query(DoctorDashboardDiagnosis).filter_by(id=diag_id).first()

        if not diagnosis:
            raise HTTPException(
                status_code=404, detail=f"Diagnosis with id {diag_id} not found"
            )

        # Unlink patient by setting patient_id to None
        diagnosis.patient_id = None
        db.commit()
        db.refresh(diagnosis)

        return diagnosis

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/")
async def update_doctor_dashboard_diagnosis(
    diag_id: str,
    diagnosis_update_data: DoctorDashboardDiagnosisUpdate,
    __token: Annotated[TokenData, Depends(doctor_decode_token)],
    db: Session = Depends(get_db),
):
    try:
        diagnosis = db.query(DoctorDashboardDiagnosis).filter_by(id=diag_id).first()

        for k, v in diagnosis_update_data:
            if v is not None:
                setattr(diagnosis, k, v)

        if not diagnosis:
            raise HTTPException(
                status_code=404, detail=f"Diagnosis with id {diag_id} not found"
            )

        db.commit()
        db.refresh(diagnosis)

        return {
            "message": "Diagnosis updated successfully",
            "doctor_dashboard_diagnosis": diagnosis,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
async def delete_doctor_dashboard_diagnosis(
    diag_id: str,
    __token: Annotated[TokenData, Depends(doctor_decode_token)],
    db: Session = Depends(get_db),
):
    try:
        diagnosis = db.query(DoctorDashboardDiagnosis).filter_by(id=diag_id).first()

        if not diagnosis:
            raise HTTPException(
                status_code=404, detail=f"Diagnosis with id {diag_id} not found"
            )

        db.delete(diagnosis)
        db.commit()

        return {"message": "Diagnosis deleted successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
