import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from starlette import status
from loguru import logger

load_dotenv()

SENDER_EMAIL = os.getenv("GMAIL_USERNAME")
SENDER_PASSWORD = os.getenv("GMAIL_PASSWORD")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")


def send_email(email_address: str, subject: str, body: str, email_type: Optional[str], is_html: bool = False):

    if is_html:
        message = MIMEMultipart("alternative")
        message.attach(MIMEText(body, "html"))
    else:
        message = MIMEMultipart()
        message.attach(MIMEText(body, "plain"))

    message["From"] = SENDER_EMAIL
    message["To"] = email_address
    message["Subject"] = subject

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(message)
        server.quit()

        logger.info(f"{email_type} email sent to {email_address}")

    except smtplib.SMTPRecipientsRefused:
        logger.error(f"Failed to send {email_type} email to {email_address}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Bad recipient address"
        )
    except smtplib.SMTPSenderRefused as e:
        logger.error(f"Problem with sender email {SENDER_EMAIL}")
        raise Exception(f"SMTP Exception: {str(e)}")
    except Exception as e:
        logger.error(f"Unable to send {email_type}. Broad exception: {str(e)}")
        raise Exception(f"Broad SMTP Exception: {str(e)}")

def send_password_reset_email(email: str, token: str):
    url = f"{FRONTEND_BASE_URL}/auth/reset/{token}"
    subject = "Password Reset Link"
    body = (
        f"Dear User,\n\nHere is your requested password reset link. If you did not request a password reset please "
        f"ignore this email.\n\n{url}\n\nRegards,\nFornix AI"
    )
    send_email(email, subject, body, email_type="password_reset_link")

def send_verification_email(email: str, user_id: str):
    url = f"{FRONTEND_BASE_URL}/auth/verify/{user_id}"
    subject = "Email Verification Link"
    body = (
        f"Hello,\n\nPlease verify your email by clicking the link below:\n{url}\n\nThank you!"
        "\nRegards,\nFornix AI"
    )
    send_email(email, subject, body, email_type="email_verification_link")

def send_welcome_email(email: str):
    subject = "Welcome to the Fornix AI Community!"
    body = (
        "Dear User,\n\n"
        "Welcome to the Fornix AI community! We are thrilled to have you join us in transforming the way "
        "doctors and patients interact. Our platform is designed to enhance communication and streamline "
        "healthcare experiences for everyone.\n\n"
        "As a member of our community, you can explore various features that will assist you in navigating "
        "your healthcare journey with ease and confidence.\n\n"
        "Feel free to reach out if you have any questions or need assistance.\n\n"
        "Best Regards,\n"
        "The Fornix AI Team"
    )
    send_email(email, subject, body, email_type="welcome")

def send_org_welcome_email(email: str, password: str, org_name: str):
    url = f"{FRONTEND_BASE_URL}/auth/signin"
    subject = "Welcome to the Fornix AI Community!"
    body = (
        f"Dear User,\n\n"
        f"Welcome to the Fornix AI community! 🎉 We’re excited to have you join us in shaping the future of healthcare.\n\n"
        f"You’ve been invited to join the {org_name} organization, and your account has already been set up with the following credentials:\n\n"
        f"Email: {email}\n"
        f"Temporary Password: {password}\n\n"
        f"👉 Please log in here: {url}\n\n"
        "For security, we recommend changing your password after your first login.\n\n"
        "As part of the Fornix AI community, you’ll have access to tools that make healthcare communication faster, smarter, and more seamless—empowering both doctors and patients.\n\n"
        "If you have any questions or need assistance, our support team is always here to help.\n\n"
        "Once again, welcome aboard! We look forward to working with you.\n\n"
        "Warm regards,\n"
        "The Fornix AI Team"
    )

    send_email(email, subject, body, email_type="welcome")

def send_password_changed_email(email: str):
    subject = "Password Changed Notification"
    body = (
        "Dear User,\n\nThis is to notify you that your password has been changed. If you did not initiate this "
        "action please report to support immediately.\n\nRegards,\nFornix AI"
    )
    send_email(email, subject, body, email_type="password_changed")