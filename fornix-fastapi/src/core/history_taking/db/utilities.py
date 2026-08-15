from functools import wraps
from typing import Dict, Optional, OrderedDict, Callable, Any
import asyncio
import time
import hashlib
import json
import asyncio
from sqlalchemy.orm import Session
from langchain_core.runnables import RunnableConfig, ensure_config

from src.database.models.user import User
from src.database.models.patient_data import ChiefComplaint


class CacheResponse:
    def __init__(self, max_size: int = 500, max_age: int = 60):
        self.cache: OrderedDict = OrderedDict()
        self.max_size = max_size
        self.max_age = max_age

    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = self.create_key(func, *args, **kwargs)

            # Check if the key exists and is not expired
            if key in self.cache:
                result, timestamp = self.cache[key]
                if time.time() - timestamp <= self.max_age:
                    self.cache.move_to_end(key)
                    return result
                else:
                    del self.cache[key]

            result = func(*args, **kwargs)

            # Store the result in cache
            self.cache[key] = (result, time.time())

            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)

            return result

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            key = self.create_key(func, *args, **kwargs)

            if key in self.cache:
                result, timestamp = self.cache[key]
                if time.time() - timestamp <= self.max_age:
                    self.cache.move_to_end(key)
                    return result
                else:
                    del self.cache[key]
            result = await func(*args, **kwargs)
            self.cache[key] = (result, time.time())
            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)

            return result

        return async_wrapper if asyncio.iscoroutinefunction(func) else wrapper

    def create_key(self, func: Callable, *args: Any, **kwargs: Any) -> str:
        key_parts = [func.__name__, repr(args), repr(sorted(kwargs.items()))]

        key_string = json.dumps(key_parts, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    def clear_cache(self) -> None:
        self.cache.clear()

    def remove_item(self, key: str) -> None:
        if key in self.cache:
            del self.cache[key]

    async def periodic_cleanup(self, interval: int = 300) -> None:
        while True:
            await asyncio.sleep(interval)
            current_time = time.time()
            expired_keys = [
                key
                for key, (_, timestamp) in self.cache.items()
                if current_time - timestamp > self.max_age
            ]
            for key in expired_keys:
                del self.cache[key]


# async def add_patient_data_to_db(data: Dict, db: Session, config: Optional[RunnableConfig]=None):
#     config = ensure_config(config=config)
#     user_id = config.get("configurable", {}).get("user_id")
#     if not user_id:
#         raise ValueError("user_id is required")


async def get_static_patient_data(db: Session, user_id: str):
    return await asyncio.to_thread(
        db.query(User).filter(User.id == user_id).first
    )
