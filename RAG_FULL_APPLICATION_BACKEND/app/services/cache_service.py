import redis
import hashlib
import json
from typing import Optional, Dict, Any
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis = None

    def _get_key(self, user_id: str, document_id: str, query: str, technique: str) -> str:
        data = f"{user_id}:{document_id}:{query}:{technique}"
        q_hash = hashlib.sha256(data.encode()).hexdigest()
        return f"rag_cache:{q_hash}"

    def get(self, user_id: str, document_id: str, query: str, technique: str) -> Optional[Dict[str, Any]]:
        if not self.redis: return None
        key = self._get_key(user_id, document_id, query, technique)
        try:
            val = self.redis.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.error(f"Redis get failed: {e}")
        return None

    def set(self, user_id: str, document_id: str, query: str, technique: str, response: Dict[str, Any]):
        if not self.redis: return
        key = self._get_key(user_id, document_id, query, technique)
        try:
            self.redis.setex(key, settings.CACHE_TTL_SECONDS, json.dumps(response))
        except Exception as e:
            logger.error(f"Redis set failed: {e}")

cache_service = CacheService()
