from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
import logging

logger = logging.getLogger(__name__)

class BM25Service:
    def __init__(self):
        # We no longer store pickle files to prevent RCE and memory bottlenecks.
        pass

    def index_chunks(self, document_id: str, chunks: List[Dict[str, Any]]):
        """Mock method for API compatibility. Chunks are now indexed dynamically on search."""
        pass

    def delete_document(self, document_id: str):
        """Mock method for API compatibility. No files to delete."""
        pass

    def search(self, document_id: str, query: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Search using BM25 by dynamically fetching chunks from DB."""
        try:
            from .supabase_client import supabase_service
            result = supabase_service.client.table("chunks").select("*").eq("document_id", document_id).execute()
            chunks = result.data
            if not chunks:
                return []
                
            texts = [c["text"] for c in chunks]
            tokenized_corpus = [text.lower().split() for text in texts]
            bm25 = BM25Okapi(tokenized_corpus)
            
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
            
        except Exception as e:
            logger.error(f"BM25 Search failed for {document_id}: {e}")
            return []

bm25_service = BM25Service()
