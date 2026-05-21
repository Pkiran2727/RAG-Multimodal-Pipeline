from sentence_transformers import CrossEncoder
from ..config import settings
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ReRankService:
    def __init__(self):
        self._model = None

    @property
    def model(self):
        if not self._model:
            logger.info(f"Initializing CrossEncoder with {settings.RERANK_MODEL}...")
            self._model = CrossEncoder(settings.RERANK_MODEL)
        return self._model

    def rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        """
        Re-score candidates using cross-encoder.
        """
        if not candidates:
            return []

        # Prepare pairs for cross-encoder
        pairs = [[query, c["text"]] for c in candidates]
        
        # Predict scores
        scores = self.model.predict(pairs)
        
        # Attach scores and sort
        for i, score in enumerate(scores):
            candidates[i]["rerank_score"] = float(score)
            
        candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
        
        return candidates[:top_k]

rerank_service = ReRankService()
