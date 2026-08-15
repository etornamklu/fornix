"""diagnosis services"""

from sqlalchemy.orm import Session

from src.core.DoctorDashboard.patient_data_schema import PatientDataMod
# from src.database.models.patient_data import PatientStaticData


async def save_patient_summary(
    patient_id: str, patient_data: PatientDataMod, db: Session, dashboard
):
    """service function for saving patient summary to db"""
    summary = ""
    async for token in dashboard.get_summary(patient_data.model_dump()):
        tk = token
        summary = summary + str(tk)
    print(summary)
    patient_data = db.query(PatientStaticData).filter(patient_id == patient_id).first()
    if patient_data:
        prev_summary = patient_data.summary
        new_summary = [summary]
        patient_data.summary = prev_summary + new_summary
        db.commit()
    else:
        print("Patient data not found")
    # db.refresh(patient_summary)
