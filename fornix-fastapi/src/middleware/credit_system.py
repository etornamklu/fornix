import json
from loguru import logger
from fastapi import Request, HTTPException
from starlette import status
from sse_starlette.sse import EventSourceResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from src.controller.auth import decode_token
from src.database.database_connection import get_db
from src.database.models import User, CreditConstants, Organization


class CreditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        user = None
        logger.info(f"Processing request for {request.url.path}")

        db: Session = next(get_db())

        credit_details: CreditConstants | None = await self.process_path(
            request.url.path.split("/"), db=db
        )
        if credit_details is None:
            logger.debug(f"No required credits for path: {request.url.path}")
            return await call_next(request)

        try:
            user = await self.authenticate_user(request, db)
            logger.info(f"Authenticated user: {user.id}, Credits: {user.credits}")
            organization = db.query(Organization).filter(Organization.id == user.organization_id).first()

            await self.check_credits(user, credit_details.required_credit,organization)

            response = await call_next(request)

            if response.headers.get("content-type") != "application/json":
                return await self.handle_streaming_response(
                    response, user, db, credit_details
                )

            if 200 <= response.status_code < 300:
                logger.info(f"Response successful for {request.url.path}")
                await self.deduct_credits(user, credit_details.required_credit, db, organization)

            response.headers["X-Credits"] = str(round(user.credits, 2))

            db.close()
            return response

        except HTTPException as hx:
            db.close()
            if user:
                logger.warning(f"HTTPException: {hx.detail} for user: {user.id}")
            else:
                logger.warning(f"HTTPException: {hx.detail} for a ? user")
            return JSONResponse(
                headers={"X-Credits": str(round(user.credits, 2))} if user else None,
                status_code=hx.status_code,
                content={"detail": hx.detail},
            )
        except Exception as e:
            db.close()
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            return JSONResponse(
                headers={"X-Credits": str(round(user.credits, 2))},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": str(e)},
            )

    async def handle_streaming_response(
            self,
            response: StreamingResponse,
            user: User,
            db: Session,
            credit_details: CreditConstants,
    ):
        logger.info(f"Handling streaming response for user: {user.id}")
        token_stats = {}
        last_chunk = b""

        async def filtered_stream_generator():
            nonlocal last_chunk

            async for chunk in response.body_iterator:
                yield chunk
                if chunk.startswith(b"data: "):
                    last_chunk += chunk.replace(b"data: ", b"").strip()
                    try:
                        if "token_stats" in last_chunk.decode("utf-8"):
                            chunk_data = json.loads(last_chunk.decode("utf-8"))
                            token_stats.update(chunk_data["token_stats"])
                            logger.debug(f"Updated token stats: {token_stats}")
                        last_chunk = b""
                    except json.JSONDecodeError:
                        print('JSON Decode error')
                        print(chunk)
                        pass

            deduction = await self.calculate_deductions(token_stats, credit_details)
            await self.deduct_credits(user, deduction, db)

        return EventSourceResponse(filtered_stream_generator())

    async def process_path(
            self, path_list: list[str], db: Session
    ) -> CreditConstants | None:
        if "external" in path_list:
            logger.debug("External path detected, skipping credit check")
            return None

        for path in path_list[::-1]:
            credit_details = (
                db.query(CreditConstants).filter(CreditConstants.route == path).first()
            )

            if credit_details:
                logger.info(f"Billable path identified: {path}")
                return credit_details
        logger.debug(f"No billable path found in: {path_list}")
        return None

    @staticmethod
    async def authenticate_user(request: Request, db: Session) -> User:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning("No authorization header provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No authorization header provided",
            )

        try:
            auth_token = auth_header.split()[-1]
            token_data = await decode_token(auth_token)
            user = db.query(User).filter(User.id == token_data.user_id).first()
            if not user:
                logger.warning(f"User not found for token: {auth_token}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
                )
            return user
        except Exception as e:
            logger.error("Invalid authentication token", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

    @staticmethod
    async def check_credits(user: User, required_credit: float, organization: Organization | None = None):
        if organization and organization.credit_usage_type == "pool":
            available_credits = organization.credits
        else:
            available_credits = user.credits

        if max(available_credits, 0) < required_credit:
            logger.warning(
                f"Insufficient credits for user: {user.id}. Required: {required_credit}, Available: {available_credits}"
            )
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credits"
            )

    @staticmethod
    async def calculate_deductions(
            token_stats: dict, credit_details: CreditConstants
    ) -> float:
        input_tokens = token_stats.get("input_tokens", 0)
        output_tokens = token_stats.get("output_tokens", 0)
        deduction = (input_tokens * credit_details.input_rates) + (
                output_tokens * credit_details.output_rates
        )
        logger.info(
            f"Calculated deduction: {deduction} from token stats: {token_stats}"
        )
        return deduction

    @staticmethod
    async def deduct_credits(user: User, deduction: float, db: Session, organization : Organization | None = None):
        try:
            logger.info(f"Deducting {deduction} credits for user: {user.id}")
            if organization and organization.credit_usage_type == "pool":
                organization.credits -= deduction
            else:
                user.credits -= deduction
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            logger.error(f"Failed to deduct credits for user: {user.id}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deduct credits",
            )
