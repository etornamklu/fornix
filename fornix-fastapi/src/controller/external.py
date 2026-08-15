from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger
from src.libraries.config import get_settings

settings = get_settings()
security = HTTPBearer()


async def authenticate_request(
        credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        if settings.external_api_key != credentials.credentials:
            logger.error(f"Invalid api key provided{credentials.credentials}")
            raise HTTPException(status_code=401, detail="Invalid API Key")

        return True
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in authenticating request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))