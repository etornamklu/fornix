from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from fastapi.responses import JSONResponse

from src.database.schema.support_emails import EmailRequest
from src.services.email import send_email

router = APIRouter()

DETAILS = {
    "support": {
        "body": """
<html>
  <body>
    <p>Dear Support Team,</p>
    <p>A new support request has been received. Please find the details below:</p>
    <p>{details}</p>
    <p>Regards,<br/>Support Request System</p>
  </body>
</html>
""",
        "subject": "Request for Support",
        "email": "partnerships@fornixlabs.com",
    },
    "demo_request": {
        "body": """
<html>
  <body>
    <p>Dear Support Team,</p>
    <p>A demo has been requested. Please find the request details below:</p>
    <p>{details}</p>
    <p>Kindly review the request and take the necessary steps to schedule and coordinate the demo.</p>
  </body>
</html>
""",
        "subject": "Request for Demo",
        "email": "partnerships@fornixlabs.com",
    },
    "sales": {
        "body": """
<html>
  <body>
    <p>Dear Sales Team,</p>
    <p>A new inquiry has been received. Please find the details below:</p>
    <p>{details}</p>
    <p>Kindly review and follow up as needed.</p>
  </body>
</html>
""",
        "subject": "Sales Inquiry",
        "email": "partnerships@fornixlabs.com",
    },
    "default": {
        "body": """
<html>
  <body>
    <p>{details}</p>
  </body>
</html>
""",
        "subject": "Default Email",
        "email": "partnerships@fornixlabs.com",
    },
}


@router.post("/email")
async def send_email_endpoint(request: EmailRequest, background_tasks: BackgroundTasks):
    try:
        details_config = DETAILS.get(request.email_type.value, None)
        if not details_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email type"
            )

        # Generate a details string with the keys emboldened using HTML.
        details_str = ""
        for key, value in request.message.items():
            details_str += f"<strong>{key}</strong>: {value}<br/><br/>"

        if details_config.get("body"):
            body = details_config["body"].format(details=details_str)
        else:
            body = details_str

        background_tasks.add_task(
            send_email,
            email_address=(
                details_config.get("email", "")
                if details_config.get("email")
                else DETAILS["support"]["email"]
            ),
            body=body,
            subject=details_config["subject"],
            email_type=request.email_type.value,
            is_html=True  # Set to True since the body is now in HTML format.
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Email is being sent in the background",
                "email_type": request.email_type.value,
            },
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
