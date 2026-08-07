from .base import BaseRAGTechnique
from ..services.embed_service import get_embedding
from typing import List, Dict, Any

class MetadataFilter(BaseRAGTechnique):
    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        filters = kwargs.get("filters", {})
        
        if not filters:
            await self.emit("DONE", "#EF4444", "Metadata Filter selected but no filters provided.")
            return []
            
        # 1. SQL Pre-filtering
        await self.emit("FILTER", "#D97706", f"SQL filter: {filters}...")
        matching_ids = await self.supabase.filter_chunk_ids(document_id, self.user_id, filters)
        
        if not matching_ids:
            await self.emit("DONE", "#EF4444", "No chunks matched filters.")
            return []
            
        await self.emit("FILTER", "#D97706", f"Found {len(matching_ids)} qualifying chunks.")
        
        # 2. Embed query
        await self.emit("EMBED", "#8B5CF6", "Embedding query...")
        q_vec = get_embedding(query)
        
        # 3. Vector Search (Filtered)
        await self.emit("SEARCH", "#16A34A", "pgvector search in filtered subset...")
        results = await self.supabase.vector_search(q_vec, document_id, self.user_id, top_k, filter_chunk_ids=matching_ids)
        
        await self.emit("DONE", "#22C55E", f"Metadata-filtered search complete. top-{top_k} returned.")
        return results

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        await self.emit("GENERATE", "#7C3AED", "Qwen3 generating answer...")
        prompt = self.build_prompt(query, chunks)
        return self.llm.generate(prompt)
