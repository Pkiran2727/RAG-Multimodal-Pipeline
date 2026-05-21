from .base import BaseRAGTechnique
from ..services.embed_service import get_embedding
from ..services.rerank_service import rerank_service
from typing import List, Dict, Any

class ReRanking(BaseRAGTechnique):
    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        # 1. Embed query
        await self.emit("EMBED", "#8B5CF6", "Embedding query...")
        q_vec = get_embedding(query)
        
        # 2. Vector Search (Fetch more candidates for re-ranking)
        await self.emit("RETRIEVE", "#16A34A", f"pgvector: fetching top-{top_k*4} candidates...")
        candidates = await self.supabase.vector_search(q_vec, document_id, self.user_id, top_k * 4)
        
        if not candidates:
            return []
            
        # 3. Cross-Encoder Re-ranking
        await self.emit("RERANK", "#EF4444", f"Cross-encoder re-scoring {len(candidates)} pairs...")
        reranked = rerank_service.rerank(query, candidates, top_k)
        
        await self.emit("DONE", "#22C55E", f"Re-ranked complete. top-{top_k} returned.")
        return reranked

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        await self.emit("GENERATE", "#7C3AED", "Qwen3 generating answer...")
        context = "\n\n".join([c["text"] for c in chunks])
        prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer based ONLY on the context:"
        return self.llm.generate(prompt)
