import json
import logging
from collections.abc import Sequence
from threading import Lock
from typing import Any

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Redis | None = None
_lock = Lock()


def _get_client() -> Redis | None:
    if not settings.redis_url:
        return None

    global _client
    if _client is not None:
        return _client

    with _lock:
        if _client is None:
            _client = Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=0.5,
                socket_timeout=0.5,
            )
    return _client


def cache_get_json(key: str) -> dict[str, Any] | list[Any] | None:
    client = _get_client()
    if client is None:
        return None

    try:
        cached_value = client.get(key)
    except RedisError:
        logger.warning("Redis read failed for key: %s", key, exc_info=True)
        return None

    if not cached_value:
        return None

    try:
        return json.loads(cached_value)
    except json.JSONDecodeError:
        try:
            client.delete(key)
        except RedisError:
            logger.warning("Redis delete failed for malformed key: %s", key, exc_info=True)
        return None


def cache_set_json(key: str, payload: Any, ttl_seconds: int | None = None) -> None:
    client = _get_client()
    if client is None:
        return

    ttl = ttl_seconds if ttl_seconds is not None else settings.cache_ttl_seconds
    if ttl <= 0:
        return

    try:
        client.setex(key, ttl, json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    except RedisError:
        logger.warning("Redis write failed for key: %s", key, exc_info=True)


def cache_delete_patterns(patterns: Sequence[str]) -> None:
    client = _get_client()
    if client is None:
        return

    try:
        keys_to_delete: list[str] = []
        for pattern in patterns:
            keys_to_delete.extend(client.scan_iter(match=pattern, count=100))
        if keys_to_delete:
            client.delete(*keys_to_delete)
    except RedisError:
        logger.warning("Redis invalidation failed for patterns: %s", patterns, exc_info=True)
