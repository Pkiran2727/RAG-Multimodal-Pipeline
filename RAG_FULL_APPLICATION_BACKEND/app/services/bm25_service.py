import pickle
import os
from pathlib import Path
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
import logging

logger = logging.getLogger(__name__)

class BM25Service:
    def __init__(self, data_dir: str = "./data/bm25_indexes"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def _get_index_path(self, document_id: str) -> Path:
        return self.data_dir / f"{document_id}.pkl"

    def index_chunks(self, document_id: str, chunks: List[Dict[str, Any]]):
        """Build and save BM25 index for a document."""
        texts = [c["text"] for c in chunks]
        tokenized_corpus = [text.lower().split() for text in texts]
        bm25 = BM25Okapi(tokenized_corpus)
        
        # Save both the bm25 object and the chunk mapping
        with open(self._get_index_path(document_id), "wb") as f:
            pickle.dump({"bm25": bm25, "chunks": chunks}, f)

    def search(self, document_id: str, query: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Search using BM25."""
        path = self._get_index_path(document_id)
        if not path.exists():
            logger.warning(f"BM25 index not found for {document_id}")
            return []

        with open(path, "rb") as f:
            data = pickle.load(f)
            bm25 = data["bm25"]
            chunks = data["chunks"]

        tokenized_query = query.lower().split()
        scores = bm25.get_scores(tokenized_query)
        
        # Add score to chunks
        results = []
        for i, score in enumerate(scores):
            if score > 0:
                chunk = chunks[i].copy()
                chunk["bm25_score"] = float(score)
                results.append(chunk)
        
        # Sort by score
        results.sort(key=lambda x: x["bm25_score"], reverse=True)
        return results[:top_n]

bm25_service = BM25Service()
