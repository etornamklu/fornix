import time
from loguru import logger
from functools import wraps
import asyncio


def time_logger(func):
    """
    Decorator function to log the time taken by any function.
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            if asyncio.iscoroutinefunction(func):

                async def async_wrapper(*args, **kwargs):
                    return await func(*args, **kwargs)

                return async_wrapper(*args, **kwargs)
            else:
                return func(*args, **kwargs)

        except Exception as e:
            logger.error(
                f"{func.__name__} failed with args={args}, kwargs={kwargs}, exception={e}"
            )
            raise
        else:
            logger.info(
                f"{func.__name__} took {time.time() - start_time} seconds and returned {result}"
            )

    return wrapper
