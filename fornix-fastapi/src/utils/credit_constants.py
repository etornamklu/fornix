REQUIRED_CREDITS: dict[str, float] = {
    # auth
    "set-role": 0,
    "update_user": 0,
    "update_name": 0,
    "logout": 0,
    "change": 0,
    "delete": 0,
    # diagnosis
    "summary": 0.001,
    "diagnose": 0.001,
    "clinical": 0.001,
    # doctor
    "items": 0.001,
    "static": 0.001,
    "chat": 0.001,
    "chat-history": 0.001,
    "online": 0.001,
    # doc patient
    "upload": 0.001,
    "transcribe": 0.001,
    "report": 0.001,
    "jobs": 0.001,
    "job": 0.001,
    "transcripts": 0.001,
    "transcript": 0.001,
    # patient
    "personal-info": 0.001,
    "family-history": 0.0010,
    "social-history": 0.0010,
    "medical-history": 0.0010,
    "drug-history": 0.0010,
    "chief-complaint": 0.0010,
    "system-enquiry": 0.0010,
    "drug-history-and-allergies": 0.001,
    # payments
    "payment": 0,
    # doctor dashboard diagnosis
    "ddd": 0,
    # billing-history
    "billing": 0,
    # connections
    "connections": 0,
}

INPUT_RATES = 0.0000425
OUTPUT_RATES = 0.00017
