import os
import asyncio
from fastapi import HTTPException
from loguru import logger
from starlette import status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, inspect, select
from fastapi import Response

from src.database.schema.user import TokenData

# from src.database.models.patient_data import PatientStaticData
# from src.database.models.patient_data import PatientDynamicData
from src.core.PatientDashboard.schema.patient_data_schema import DynamicPatientData
from src.database.schema.patient import StaticDataDto

from src.database.models import (
    MedicalHistory,
    DrugHistoryAndAllergies,
    FamilyHistory,
    SocialHistory,
    PersonalInformation,
    ChiefComplaint,
    SystemicEnquiry,
    User,
)


async def update_database(collector, dynamic_data_id: str, db: Session):
    await collector.invoke_task
    some_dynamic_data = DynamicPatientData(**collector.patient.model_dump()).__dict__
    update_data = {field: value for field, value in some_dynamic_data.items()}
    attrs = inspect(PatientDynamicData).attrs

    update_dict = {
        getattr(PatientDynamicData, field): update_data[field]
        for field in update_data.keys()
        if field in attrs.keys()
    }
    db.query(PatientDynamicData).filter(
        PatientDynamicData.id == dynamic_data_id
    ).update(update_dict, synchronize_session=False)
    db.commit()


async def collect_patient_dynamic_data(
    patient_id: str, dynamic_data_id: str, db: Session, message: str, collector
):
    # get patient data from db
    patient_data = (
        db.query(PatientStaticData)
        .filter(PatientStaticData.patient_id == patient_id)
        .first()
    )
    if not patient_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient Data Not Found"
        )
    static_data = patient_data.__dict__.copy()
    print(static_data)

    patient_dynamic_data = (
        db.query(PatientDynamicData)
        .filter(PatientDynamicData.id == dynamic_data_id)
        .first()
    )
    if not patient_dynamic_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No dynamic data instance found for patient",
        )
    # pass patient data to question generator
    query = message
    response = await collector.get_completion(query, static_data)
    # store answer to previous question in db
    asyncio.create_task(update_database(collector, dynamic_data_id, db))
    return {"query": response}


def fetch_patient(patient_id: str, db: Session) -> StaticDataDto:
    patient_data = (
        db.query(PatientStaticData)
        .filter(PatientStaticData.patient_id == patient_id)
        .first()
        .__dict__
    )
    return StaticDataDto(**patient_data)


def store_patient_static_data(
    patient_static_data,
    PatientStaticFirst,
    level: str,
    token: TokenData,
    db: Session,
):
    """endpoint to store patient static demographic data"""
    try:
        patient_static_dict = patient_static_data.model_dump()
        patient_static_dict["level"] = level
        patient_static_data = (
            db.query(PatientStaticData)
            .filter(PatientStaticData.patient_id == token.user_id)
            .first()
        )
        if patient_static_data:
            patient_static_data_dict = PatientStaticFirst(
                **patient_static_data.__dict__
            ).model_dump()
            patient_static_data_dict.update(patient_static_dict)

            updated_static_data = (
                db.query(PatientStaticData)
                .filter(PatientStaticData.patient_id == token.user_id)
                .update(patient_static_data_dict, synchronize_session=False)
            )
            db.commit()
            return {
                "message": "Patient Static Data updated successfully",
            }
        patient_static_dict["patient_id"] = token.user_id
        patient_data = PatientStaticData(**patient_static_dict)
        db.add(patient_data)
        db.commit()
        db.refresh(patient_data)
        response_data = PatientStaticFirst(**patient_data.__dict__)

        return {
            "message": "Patient Static Data created successfully",
            "patient_static_data": {
                "id": patient_data.id,
                "patient_id": patient_data.patient_id,
                "patient_static_data": response_data,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# update_data = {field: value for field, value in patient_static_dict.items()}
#             attrs = inspect(PatientStaticData).attrs
#             update_dict = {
#                 getattr(PatientStaticData, field): update_data[field]
#                 for field in update_data.keys()
#                 if field in attrs.keys()
#             }
#             print(update_dict)
#             db.query(PatientStaticData).filter(
#                 PatientStaticData.patient_id == token.user_id
#             ).update(update_dict, synchronize_session=False)


def get_patient_medfind_data(patient_id: str, db: Session):
    try:
        # Subqueries to find the latest records for each table
        latest_chief_complaint = select(
            ChiefComplaint.id.label('id')
        ).where(
            ChiefComplaint.patient_id == patient_id
        ).order_by(
            desc(ChiefComplaint.updated_at)
        ).limit(1)

        latest_systemic_enquiry = select(
            SystemicEnquiry.id.label('id')
        ).where(
            SystemicEnquiry.patient_id == patient_id
        ).order_by(
            desc(SystemicEnquiry.updated_at)
        ).limit(1)

        latest_drug_history = select(
            DrugHistoryAndAllergies.id.label('id')
        ).where(
            DrugHistoryAndAllergies.patient_id == patient_id
        ).order_by(
            desc(DrugHistoryAndAllergies.updated_at)
        ).limit(1)

        # Fetch patient medical history along with all related tables
        patient_medfind_data = (
            db.query(MedicalHistory)
            .join(User, MedicalHistory.patient_id == User.id)  # Join User first
            .outerjoin(PersonalInformation, User.id == PersonalInformation.patient_id)
            .outerjoin(SocialHistory, User.id == SocialHistory.patient_id)
            .outerjoin(FamilyHistory, User.id == FamilyHistory.patient_id)
            .outerjoin(
                DrugHistoryAndAllergies, 
                (User.id == DrugHistoryAndAllergies.patient_id) & 
                (DrugHistoryAndAllergies.id.in_(latest_drug_history))
            )
            .outerjoin(
                ChiefComplaint, 
                (User.id == ChiefComplaint.patient_id) & 
                (ChiefComplaint.id.in_(latest_chief_complaint))
            )
            .outerjoin(
                SystemicEnquiry, 
                (User.id == SystemicEnquiry.patient_id) & 
                (SystemicEnquiry.id.in_(latest_systemic_enquiry))
            )
            .filter(MedicalHistory.patient_id == patient_id)
            .options(
                joinedload(MedicalHistory.user).joinedload(User.personal_information),
                joinedload(MedicalHistory.user).joinedload(User.social_history),
                joinedload(MedicalHistory.user).joinedload(User.family_history),
                joinedload(MedicalHistory.user).joinedload(User.drug_history_and_allergies),
                joinedload(MedicalHistory.user).joinedload(User.chief_complaint),
                joinedload(MedicalHistory.user).joinedload(User.systemic_enquiry),
            )
            .first()
        )

        # Rest of your function remains the same
        if not patient_medfind_data:
            return {}

        # Helper function to serialize SQLAlchemy model instances to dictionaries.
        def serialize(model_instance):
            """Helper function to serialize SQLAlchemy model instances to dictionaries."""

            exclude_fields = {"id", "patient_id", "created_at", "updated_at"}

            if model_instance is None:
                return None
            elif isinstance(model_instance, list):
                # If it's a list (one-to-many relationship), serialize each item in the list
                return [serialize(item) for item in model_instance]
            else:
                return {
                    column.name: getattr(model_instance, column.name)
                    for column in model_instance.__table__.columns
                    if column.name not in exclude_fields
                }

        # Serialize main table
        result = serialize(patient_medfind_data)

        # Serialize related tables correctly (access via `user`)
        result["personal_information"] = serialize(
            patient_medfind_data.user.personal_information
            if patient_medfind_data.user
            else None
        )
        result["social_history"] = serialize(
            patient_medfind_data.user.social_history
            if patient_medfind_data.user
            else None
        )
        result["family_history"] = serialize(
            patient_medfind_data.user.family_history
            if patient_medfind_data.user
            else None
        )
        result["drug_history"] = serialize(
            patient_medfind_data.user.drug_history_and_allergies
            if patient_medfind_data.user
            else None
        )
        result["chief_complaint"] = serialize(
            patient_medfind_data.user.chief_complaint
            if patient_medfind_data.user
            else None
        )
        result["systemic_enquiry"] = serialize(
            patient_medfind_data.user.systemic_enquiry
            if patient_medfind_data.user
            else None
        )

        return result

    except Exception as e:
        raise e
    

def set_auth_cookie(response: Response, token: str, key: str = "access-token"):
    try:
        environment = os.getenv("ENVIRONMENT", "Development")
        secure_flag = environment != "Development"

        response.set_cookie(
            key=key,
            value=token,
            httponly=True,
            max_age=43800 * 60,
            samesite="lax",
            secure=secure_flag,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set authentication cookie: {str(e)}",
        ) from e
