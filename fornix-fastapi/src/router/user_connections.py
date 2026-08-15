from datetime import datetime
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    WebSocketException,
)
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload
from starlette import status
from starlette.websockets import WebSocketDisconnect, WebSocket, WebSocketState

from src.controller.auth import doctor_decode_token, decode_token
from src.controller.user_connections import mask_user, schedule_reject_task
from src.database.database_connection import get_db
from src.database.models import User, UserConnections
from src.database.models.user_connections import RequestStatusEnum
from src.database.schema.user import TokenData
from src.database.schema.user_connections import (
    GetUserInfoSchema,
    RequestConnectionSchema,
    UserConnectionsSchema,
    UserConnectionsUserSchema,
)
from src.socket.socket_manager import SocketManager, get_socket_manager

router = APIRouter()


# handling connections between doctor and patient
# single endpoint to make connection requests
# single endpoint to accept or reject connection request
# single endpoint to get all connected users + pending + past connections
# endpoint to get user info from 8char code


@router.get("/connections/userinfo/{user_code}")
async def get_user_info(
        user_code: str,
        __token: Annotated[TokenData, Depends(doctor_decode_token)],
        db: Session = Depends(get_db),
):
    # takes user 8 char code from request
    # returns masked user data
    try:
        patient = db.query(User).filter_by(user_code=user_code).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
            )

        return {"user": UserConnectionsUserSchema(**patient.__dict__)}

    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/connections/create/{patient_user_code}")
async def create_connection(
        patient_user_code: str,
        __token: Annotated[TokenData, Depends(doctor_decode_token)],
        db: Session = Depends(get_db),
):
    try:
        # Retrieve the doctor (sender) from the token
        doctor = db.query(User).filter_by(id=__token.user_id).first()
        if not doctor or doctor.role not in ['DOCTOR', 'PHARMACY']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clinicians can send connection requests.",
            )

        # Retrieve the patient (receiver) using the provided user_code
        patient = db.query(User).filter_by(user_code=patient_user_code).first()
        if not patient or patient.role != "PATIENT":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found."
            )

        # Check if a connection request already exists
        existing_request = (
            db.query(UserConnections)
            .filter(
                UserConnections.sender_id == doctor.id,
                UserConnections.receiver_id == patient.id,
            )
            .first()
        )

        if existing_request:
            # If the request was previously rejected, allow updating it to PENDING
            if existing_request.connection_status == RequestStatusEnum.REJECTED:
                existing_request.connection_status = RequestStatusEnum.PENDING
                db.commit()
                schedule_reject_task(existing_request.id)
                return {"message": "Rejected connection updated to pending."}
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Connection request already exists.",
                )

        # Create a new connection request with status PENDING
        new_request = UserConnections(
            sender_id=doctor.id,
            receiver_id=patient.id,
            receiver_user_code=patient.user_code,
            connection_status=RequestStatusEnum.PENDING,
        )
        db.add(new_request)
        db.commit()

        schedule_reject_task(new_request.id)

        return {"message": "Connection request sent successfully."}

    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


# deprecated
@router.websocket("/ws/connect/{user_code}")
async def websocket_connect(
        websocket: WebSocket,
        user_code: str,
        db: Session = Depends(get_db),
        socket_manager: SocketManager = Depends(get_socket_manager),
):
    try:
        # Validate user and retrieve user role
        user = db.query(User).filter(User.user_code == user_code).first()
        if not user:
            await websocket.close()
            return

        # Connect the WebSocket
        await socket_manager.connect(websocket, user.id)

        if user.role == "DOCTOR":
            # Doctor role: Listen for status updates
            while True:
                data = await websocket.receive_text()
                message_data = data.split(";")

                if len(message_data) != 2:
                    await websocket.close()
                    return

                receiver_user_code = message_data[0]
                request_status = message_data[1]
                receiver_user = (
                    db.query(User).filter(User.user_code == receiver_user_code).first()
                )

                if not receiver_user:
                    await websocket.send_text("Receiver not found.")
                    continue

                # Check if a connection request already exists
                existing_request = (
                    db.query(UserConnections)
                    .filter(
                        UserConnections.sender_id == user.id,
                        UserConnections.receiver_id == receiver_user.id,
                    )
                    .first()
                )

                if request_status == "PENDING":
                    # create a connection request if none
                    if existing_request:
                        await websocket.send_text("Connection request already exists.")
                    else:
                        # Create a new connection request
                        new_request = UserConnections(
                            sender_id=user.id,
                            receiver_id=receiver_user.id,
                            receiver_user_code=receiver_user.user_code,
                            connection_status=RequestStatusEnum.PENDING,
                        )
                        db.add(new_request)
                        db.commit()
                        await websocket.send_text("Connection request sent.")
                else:
                    await websocket.send_text(f"Invalid status: {request_status}")
                    continue

                receiver_socket = await socket_manager.get_socket(receiver_user.id)
                if receiver_socket:
                    await socket_manager.send_data(
                        receiver_user.id,
                        event_type="status_update",
                        data=request_status,
                    )
                else:
                    await websocket.send_text("Receiver is not connected.")

        elif user.role == "PATIENT":
            # Patient role: Receive updates and send to the doctor
            while True:
                data = await websocket.receive_text()
                message_data = data.split(";")

                if len(message_data) != 2:
                    await websocket.close()
                    return

                doctor_user_code = message_data[0]
                status_update = message_data[1]
                doctor_user = (
                    db.query(User).filter(User.user_code == doctor_user_code).first()
                )

                if not doctor_user:
                    await websocket.send_text("Doctor not found.")
                    continue

                connection_request = (
                    db.query(UserConnections)
                    .filter(
                        UserConnections.sender_id == doctor_user.id,
                        UserConnections.receiver_id == user.id,
                    )
                    .first()
                )

                if status_update == "ACCEPTED":
                    if connection_request:
                        connection_request.connection_status = (
                            RequestStatusEnum.ACCEPTED
                        )
                        db.commit()
                        # Notify doctor of acceptance
                        doctor_socket = await socket_manager.get_socket(doctor_user.id)
                        if doctor_socket:
                            await socket_manager.send_data(
                                doctor_user.id,
                                event_type="status_update",
                                data="accepted",
                            )
                        else:
                            await websocket.send_text("Doctor is not connected.")
                    else:
                        await websocket.send_text("No pending request found.")

                elif status_update == "REJECTED":
                    if connection_request:
                        connection_request.connection_status = (
                            RequestStatusEnum.REJECTED
                        )
                        db.commit()
                        # Notify doctor of rejection
                        doctor_socket = await socket_manager.get_socket(doctor_user.id)
                        if doctor_socket:
                            await socket_manager.send_data(
                                doctor_user.id,
                                event_type="status_update",
                                data="rejected",
                            )
                        else:
                            await websocket.send_text("Doctor is not connected.")
                    else:
                        await websocket.send_text("No pending request found.")

                else:
                    await websocket.send_text("Invalid status.")
                    continue

                doctor_socket = await socket_manager.get_socket(doctor_user.id)
                if doctor_socket:
                    await socket_manager.send_data(
                        doctor_user.id, event_type="status_update", data=status_update
                    )
                else:
                    await websocket.send_text("Doctor is not connected.")

    except WebSocketDisconnect:
        await socket_manager.close_socket(user.id)

    except Exception as e:
        await websocket.close()
        print(f"An error occurred: {e}")


@router.get("/connections")
async def get_connections(
        __token: Annotated[TokenData, Depends(decode_token)],
        db: Session = Depends(get_db),
):
    try:
        # get all connections belonging to the user
        user = db.query(User).filter_by(id=__token.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        connections = (
            db.query(UserConnections)
            .options(
                joinedload(UserConnections.doctor).load_only(
                    User.id, User.user_code, User.name, User.role
                ),
                joinedload(UserConnections.patient).load_only(
                    User.id, User.user_code, User.name, User.role
                ),
            )
            .filter(
                (UserConnections.sender_id == user.id)
                | (UserConnections.receiver_id == user.id)
            )
            .order_by(desc(UserConnections.updated_at))
            .all()
        )

        return {
            "connections": [
                UserConnectionsSchema(**connection.__dict__)
                for connection in connections
            ]
        }

    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.delete("/connections/delete/{user_code}")
async def delete_connection(
        user_code: str,
        __token: Annotated[
            TokenData, Depends(decode_token)
        ],  # For both doctor and patient roles
        db: Session = Depends(get_db),
):
    try:
        user = db.query(User).filter_by(id=__token.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found."
            )

        other_user = db.query(User).filter_by(user_code=user_code).first()
        if not other_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Other user not found."
            )

        connection = (
            db.query(UserConnections)
            .filter(
                (UserConnections.sender_id == user.id)
                & (UserConnections.receiver_id == other_user.id)
                | (UserConnections.sender_id == other_user.id)
                & (UserConnections.receiver_id == user.id)
            )
            .first()
        )

        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found."
            )

        # Delete the connection
        db.delete(connection)
        db.commit()

        return {"message": "Connection deleted successfully."}

    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


@router.post("/connections/{action}/{doctor_user_code}")
async def handle_connection_request(
        doctor_user_code: str,
        action: str,  # either 'accept' or 'reject'
        __token: TokenData = Depends(decode_token),
        db: Session = Depends(get_db),
):
    try:
        patient = db.query(User).filter(User.id == __token.user_id).first()

        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
            )

        if patient.role != "PATIENT":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can accept or reject requests",
            )

        doctor = db.query(User).filter(User.user_code == doctor_user_code).first()

        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
            )

        connection_request = (
            db.query(UserConnections)
            .filter(
                UserConnections.sender_id == doctor.id,
                UserConnections.receiver_id == patient.id,
                UserConnections.connection_status == RequestStatusEnum.PENDING,
            )
            .first()
        )

        if not connection_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pending connection request found",
            )

        if action == "accept":
            connection_request.connection_status = RequestStatusEnum.ACCEPTED
            db.commit()
            return {"message": "Connection request accepted successfully"}

        elif action == "reject":
            connection_request.connection_status = RequestStatusEnum.REJECTED
            db.commit()
            return {"message": "Connection request rejected successfully"}

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action."
            )
    except HTTPException as hx:
        raise hx
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
