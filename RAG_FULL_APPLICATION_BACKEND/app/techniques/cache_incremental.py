from .base import BaseRAGTechnique
from ..services.cache_service import cache_service
from .hybrid_search import HybridSearch
from typing import List, Dict, Any

class CacheIncrementalRAG(BaseRAGTechnique):
    async def run(self, query: str, document_id: str, top_k: int = 5, **kwargs) -> Dict[str, Any]:
        technique_name = kwargs.get("underlying_technique", "hybrid")
        
        # 1. Cache Check
        await self.emit("CACHE_CHECK", "#6B7280", "Checking Redis cache for previous answer...")
        
        cached_result = cache_service.get(self.user_id, document_id, query, technique_name)
        if cached_result:
            await self.emit("CACHE_HIT", "#22C55E", "Cache hit! Returning stored answer (0ms).")
            return cached_result
            
        await self.emit("CACHE_MISS", "#8B5CF6", "Cache miss. Running full RAG pipeline...")
        
        # 2. Run Underlying Technique (e.g., Hybrid)
        # For simplicity, we use Hybrid as the default fallback
        underlying = HybridSearch(self.job_id, self.user_id)
        result = await underlying.run(query, document_id, top_k)
        
        # 3. Store in Cache
        cache_service.set(self.user_id, document_id, query, technique_name, result)
        
        await self.emit("DONE", "#22C55E", "Answer cached for future queries.")
        return result

    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        # Not used directly in Run override
        pass

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        # Not used directly in Run override
        pass
