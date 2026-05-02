from .base import BaseRAGTechnique
from ..services.bm25_service import bm25_service
from ..services.embed_service import get_embedding
from ..utils.rank_utils import reciprocal_rank_fusion
from typing import List, Dict, Any

class HybridSearch(BaseRAGTechnique):
    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        # 1. Embed query
        await self.emit("EMBED", "#8B5CF6", "Embedding query (bge-m3)...")
        q_vec = get_embedding(query)
        
        # 2. BM25 Search
        await self.emit("BM25", "#22C55E", "BM25 keyword search...")
        bm25_results = bm25_service.search(document_id, query, top_n=top_k * 4)
        
        # 3. Vector Search
        await self.emit("VECTOR", "#16A34A", "pgvector ANN search...")
        vector_results = await self.supabase.vector_search(q_vec, document_id, self.user_id, top_k * 4)
        
        # 4. Fusion
        await self.emit("RRF", "#8B5CF6", "Reciprocal Rank Fusion merging results...")
        fused = reciprocal_rank_fusion(bm25_results, vector_results, k=60)
        
        await self.emit("DONE", "#22C55E", f"Hybrid search complete. top-{top_k} returned.")
        return fused[:top_k]

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        await self.emit("GENERATE", "#7C3AED", "Qwen3 generating answer...")
        context = "\n\n".join([c["text"] for c in chunks])
        prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer based ONLY on the context:"
        return self.llm.generate(prompt)
