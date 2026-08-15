from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from typing import Annotated
from uuid import UUID
from fastapi import Depends, HTTPException, status
from loguru import logger
from sqlalchemy.orm import Session

from src.database.schema.user import TokenData
from src.database.database_connection import get_db, SessionLocal
from src.controller.auth import token_decoder, oauth2_scheme_user
from src.database.models.user_connections import RequestStatusEnum
from src.database.models import User, UserConnections

scheduler = BackgroundScheduler()
scheduler.start()

def mask_user(user: User) -> User:
    def mask_name(name: str) -> str:
        # Mask all but the first letter of each name part
        return name[0] + "*" * (len(name) - 1) if len(name) > 1 else name

    masked_name = " ".join(mask_name(part) for part in user.name.split())
    user.name = masked_name
    return user


def reject_connection_request_job(connection_id: UUID):
    try:
        logger.info(
            f"Reject task initiated for connection_id={connection_id}."
        )
        
        # Create a new database session
        with SessionLocal() as db:
            try:
                # Query the connection
                connection = (
                    db.query(UserConnections)
                    .filter_by(id=connection_id, connection_status=RequestStatusEnum.PENDING)
                    .first()
                )
                
                if connection:
                    connection.connection_status = RequestStatusEnum.REJECTED
                    db.commit()
                    logger.info(
                        f"Connection request {connection_id} has been rejected due to timeout."
                    )
                else:
                    logger.warning(
                        f"No pending connection found for connection_id={connection_id}. No action taken."
                    )
            
            except Exception as db_error:
                db.rollback()
                logger.error(
                    f"Database error for connection_id={connection_id}: {db_error}"
                )
    
    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"An unexpected error occurred while processing connection_id={connection_id}: {e}"
        )

def schedule_reject_task(connection_id: UUID):
    """Schedule a task to reject the connection request after 10 minutes."""
    run_time = datetime.now() + timedelta(minutes=10)
    scheduler.add_job(
        reject_connection_request_job,
        'date',
        run_date=run_time,
        args=[connection_id],
        id=str(connection_id),
    )
    logger.info(f"Task scheduled to reject connection {connection_id} at {run_time}.")



async def validate_user_access(
    patient_id: UUID,
    token: Annotated[str, Depends(oauth2_scheme_user)],
    db: Session = Depends(get_db),
) -> TokenData:
    
    user = token_decoder(token)
    
    if user.role == "PATIENT" and user.user_id == patient_id:
        return user
    
    if user.role in ["PHARMACY", "DOCTOR"]:
        
        connection = (
            db.query(UserConnections)
            .filter_by( 
                sender_id=user.user_id, 
                receiver_id=patient_id,
                connection_status=RequestStatusEnum.ACCEPTED
            )
            .first()
        )
        
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No valid connection found"
            )
        
        return user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Unauthorized role for this action"
    )
