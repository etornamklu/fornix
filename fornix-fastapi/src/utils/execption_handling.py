import functools

from fastapi import HTTPException
from loguru import logger
from openai import APITimeoutError, APIConnectionError, RateLimitError

def openai_exception_handler(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            match e:
                case APITimeoutError():
                    logger.error(f"OpenAI Timeout: {e}")
                    raise HTTPException(status_code=500, detail=f"OpenAI Timeout: {e}")
                case APIConnectionError():
                    logger.error(f"OpenAI Connection Error: {e}")
                    raise HTTPException(status_code=500, detail=f"OpenAI Connection Error: {e}")
                case RateLimitError():
                    logger.error(f"OpenAI Rate Limit: {e}")
                    raise HTTPException(status_code=e.status_code, detail=f"OpenAI Rate Limit: {e}")
                case _:
                    logger.error(f"General Audio Processing Error: {e}")
                    raise HTTPException(status_code=500, detail=f"Audio processing failed: {e}")
    return wrapper
