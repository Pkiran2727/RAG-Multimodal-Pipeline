from .base import BaseRAGTechnique
from ..services.bm25_service import bm25_service
from ..services.embed_service import get_embedding
from ..utils.rank_utils import reciprocal_rank_fusion
from typing import List, Dict, Any

class HybridSearch(BaseRAGTechnique):
    async def retrieve(self, query: str, document_id: str, top_k: int = 5, **kwargs) -> List[Dict[str, Any]]:
        # 1. Embed query
        await self.emit("EMBED", "#8B5CF6", "Embedding query using bge-m3 dense encoder...", {
            "model": "bge-m3",
            "dimension": 1024,
            "truncation": "1k tokens"
        })
        q_vec = get_embedding(query)
        
        # 2. BM25 Search
        bm25_pkl_path = f"data/bm25_indexes/{document_id}.pkl"
        await self.emit("BM25", "#22C55E", f"Executing BM25 lexical keyword search on {bm25_pkl_path}...", {
            "index_type": "Okapi BM25",
            "local_index_path": bm25_pkl_path,
            "k1": 1.5,
            "b": 0.75,
            "candidates_fetched": top_k * 4
        })
        bm25_results = bm25_service.search(document_id, query, top_n=top_k * 4)
        
        # 3. Vector Search
        await self.emit("VECTOR", "#16A34A", "Executing Supabase pgvector ANN cosine similarity search...", {
            "storage": "Supabase Vector Database",
            "table": "chunks",
            "distance_metric": "Cosine Distance (<=>)",
            "candidates_fetched": top_k * 4
        })
        vector_results = await self.supabase.vector_search(q_vec, document_id, self.user_id, top_k * 4)
        
        # 4. Fusion
        await self.emit("RRF", "#8B5CF6", "Merging BM25 lexical and pgvector semantic ranks via Reciprocal Rank Fusion (RRF)...", {
            "algorithm": "Reciprocal Rank Fusion",
            "rrf_k": 60,
            "bm25_count": len(bm25_results),
            "vector_count": len(vector_results)
        })
        fused = reciprocal_rank_fusion(bm25_results, vector_results, k=60)
        
        await self.emit("RETRIEVAL_COMPLETE", "#22C55E", f"Hybrid search complete. Selected top-{top_k} highest-ranking chunks.", {
            "top_k": top_k,
            "final_count": len(fused[:top_k])
        })
        return fused[:top_k]

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        await self.emit("GENERATE", "#7C3AED", "Generating response via LLM Dispatcher (Qwen Primary -> GLM-4.7-Flash Backup)...", {
            "primary_model": "Qwen3",
            "backup_model": "GLM-4.7-Flash",
            "context_chunks": len(chunks),
            "temperature": 0.1
        })
        prompt = self.build_prompt(query, chunks)
        return self.llm.generate(prompt)

