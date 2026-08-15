from functools import wraps
import time
from loguru import logger


def async_time_logger(func):
    """
    Decorator function to log the time taken by any asynchronous function.

    This decorator logs the execution time of the decorated asynchronous function, as well as the function's arguments and return value.
    If an exception occurs during the execution of the function, it logs the exception and re-raises it.

    Args:
        func (Callable): The asynchronous function to be decorated.

    Returns:
        Callable: The decorated asynchronous function.
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"{func.__name__} failed with exception={e}")
            raise
        else:
            end_time = time.time()
            logger.info(f"{func.__name__} took {(end_time - start_time):.3f} seconds")
            return result

    return wrapper
