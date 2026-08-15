import base64
import json

import redis
from loguru import logger
from src.libraries.config import get_settings

settings = get_settings()

TTL_SECONDS = 60 * 30

redis_cache = redis.Redis.from_url(
    url=settings.redis_url,
    decode_responses=True
)

def set_occupation_marker(report_id: str) -> int:
    logger.info(f"setting occupation marker for audio chunks in background, cache: {report_id}")
    index = redis_cache.rpush(report_id,"__PENDING__") - 1
    logger.info(f'occupation marker set at index: {index}')
    return index

def cache_transcribed_details_at_index(report_id: str, index: int, details: dict):
    redis_cache.lset(
        name=report_id,
        index=index,
        value=json.dumps(details),
    )
    redis_cache.expire(report_id, TTL_SECONDS)
    logger.info(f"cache transcribed text at index: {index}")

def get_transcribed_text_from_cache(report_id: str):
    audio_details = redis_cache.lrange(
        name=report_id,
        start=0,
        end=-1
    )
    return ".".join([json.loads(detail).get('text') for detail in audio_details if detail != "__PENDING__"])

def get_transcribed_audio_from_cache(report_id: str):
    audio_details = redis_cache.lrange(
        name=report_id,
        start=0,
        end=-1
    )
    return b"".join([base64.b64decode(json.loads(detail).get('audio_bytes')) for detail in audio_details if detail != "__PENDING__"])

def delete_cache(key: str):
    redis_cache.delete(key)
    logger.info(f"cache deleted key {key}")



