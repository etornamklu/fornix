from fastapi import HTTPException
from starlette import status


def get_patient_data_response(user):
    """Common function to format patient data response, returning only the latest entries based on updated_at"""

    def _latest(records):
        # Return the record with the most recent updated_at, or None if empty
        if not records:
            return None
        return [max(records, key=lambda r: r.updated_at)]

    return {
        "message": "Patient data retrieved successfully",
        "data": {
            # For one-to-one relationships, return as-is
            "personal_info": user.personal_information,
            "family_history": user.family_history,
            "social_history": user.social_history,

            # For list relationships, pick the latest by updated_at
            "systemic_enquiry": _latest(user.systemic_enquiry),
            "chief_complaints": _latest(user.chief_complaint),
            "medical_history": _latest(user.medical_history),
            "drug_history_and_allergies": _latest(user.drug_history_and_allergies),
        },
    }


def validate_patient(user):
    """Common validation for patient role"""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if user.role != "PATIENT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not valid for such operation."
        )
    return user
