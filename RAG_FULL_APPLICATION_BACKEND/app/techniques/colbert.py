from .base import BaseRAGTechnique
from ..services.embed_service import get_embedding
import numpy as np
from typing import List, Dict, Any
import tiktoken

class ColBERT(BaseRAGTechnique):
    def __init__(self, job_id: str, user_id: str):
        super().__init__(job_id, user_id)
        self.enc = tiktoken.get_encoding("cl100k_base")

    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        # 1. Tokenize
        await self.emit("TOKENIZE", "#7C3AED", "Tokenizing query into tokens...")
        tokens = self.enc.encode(query)
        token_texts = [self.enc.decode([t]) for t in tokens]
        
        # 2. Embed tokens
        await self.emit("EMBED_TOK", "#8B5CF6", f"Embedding {len(token_texts)} query tokens (bge-m3)...")
        query_embeddings = []
        for t in token_texts:
            query_embeddings.append(get_embedding(t))
        
        # 3. Fetch all chunk token vectors for the document
        # Warning: This can be large!
        await self.emit("MAXSIM", "#EF4444", "Fetching token vectors and computing MaxSim scoring...")
        token_rows = await self.supabase.get_colbert_tokens(document_id)
        
        if not token_rows:
            await self.emit("DONE", "#EF4444", "No ColBERT tokens found for document.")
            return []
            
        # Group tokens by chunk_id
        chunk_token_map = {}
        for row in token_rows:
            c_id = row["chunk_id"]
            if c_id not in chunk_token_map: chunk_token_map[c_id] = []
            chunk_token_map[c_id].append(row["embedding"])
            
        # 4. MaxSim Calculation
        # MaxSim(q,d) = Σ max_j(q_i · d_j)
        chunk_scores = []
        for chunk_id, d_embeddings in chunk_token_map.items():
            score = 0
            d_matrix = np.array(d_embeddings) # (n_d, dim)
            q_matrix = np.array(query_embeddings) # (n_q, dim)
            
            # dot product: (n_q, n_d)
            similarities = np.dot(q_matrix, d_matrix.T)
            
            # max over document tokens (axis 1)
            max_sims = np.max(similarities, axis=1)
            
            # sum over query tokens
            score = np.sum(max_sims)
            chunk_scores.append({"chunk_id": chunk_id, "colbert_score": float(score)})
            
        # 5. Rank and return
        chunk_scores.sort(key=lambda x: x["colbert_score"], reverse=True)
        top_ids = [s["chunk_id"] for s in chunk_scores[:top_k]]
        
        # Fetch chunk details
        chunks = await self.supabase.get_chunks_by_ids(top_ids)
        
        # Ensure order matches top_ids
        id_to_chunk = { (c.get("id") or c.get("chunk_id")): c for c in chunks }
        results = [id_to_chunk[cid] for cid in top_ids if cid in id_to_chunk]
        
        await self.emit("DONE", "#22C55E", f"ColBERT scoring complete. top-{top_k} returned.")
        return results

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        await self.emit("GENERATE", "#7C3AED", "Qwen3 generating answer...")
        context = "\n\n".join([c["text"] for c in chunks])
        prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer based ONLY on the context:"
        return self.llm.generate(prompt)
