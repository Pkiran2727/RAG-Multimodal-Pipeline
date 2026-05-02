from .base import BaseRAGTechnique
from ..services.embed_service import get_embedding
import asyncio
from typing import List, Dict, Any

class QueryExpansion(BaseRAGTechnique):
    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        # 1. HyDE - Hypothetical Answer
        await self.emit("HYDE", "#8B5CF6", "Qwen3 generating hypothetical answer (HyDE)...")
        hyde_prompt = f"Provide a brief hypothetical answer to the following question. Question: {query}\n\nAnswer:"
        hypothetical_answer = self.llm.generate(hyde_prompt)
        
        # 2. Multi-Query Expansion
        await self.emit("EXPAND", "#7C3AED", "Generating 3 query variants...")
        expand_prompt = f"Generate 3 different search queries to find information for: {query}. Respond ONLY with the queries, one per line."
        expansion_text = self.llm.generate(expand_prompt)
        expanded_queries = [q.strip() for q in expansion_text.split("\n") if q.strip()][:3]
        
        all_queries = [query, hypothetical_answer] + expanded_queries
        
        # 3. Embedding multiple queries
        await self.emit("EMBED", "#8B5CF6", f"Embedding {len(all_queries)} expanded queries...")
        # Sequential for safety with HF Space limits
        vectors = []
        for q in all_queries:
            vectors.append(get_embedding(q))
            
        # 4. Search and Merge
        await self.emit("SEARCH", "#16A34A", "pgvector search with all variants...")
        all_results = []
        for vec in vectors:
            results = await self.supabase.vector_search(vec, document_id, self.user_id, top_k)
            all_results.extend(results)
            
        # Deduplicate by chunk_id
        await self.emit("MERGE", "#8B5CF6", f"Deduplicating {len(all_results)} results...")
        seen = set()
        deduped = []
        for r in all_results:
            c_id = r.get("id") or r.get("chunk_id")
            if c_id not in seen:
                deduped.append(r)
                seen.add(c_id)
        
        # Re-sort by similarity (approximate)
        deduped.sort(key=lambda x: x.get("similarity", 0), reverse=True)
        
        await self.emit("DONE", "#22C55E", f"Query expansion complete. top-{top_k} returned.")
        return deduped[:top_k]

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        await self.emit("GENERATE", "#7C3AED", "Qwen3 generating answer...")
        context = "\n\n".join([c["text"] for c in chunks])
        prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer based ONLY on the context:"
        return self.llm.generate(prompt)
