from typing import List, Dict, Any

def reciprocal_rank_fusion(bm25_results: List[Dict[str, Any]], vector_results: List[Dict[str, Any]], k: int = 60) -> List[Dict[str, Any]]:
    """
    Reciprocal Rank Fusion (RRF) to merge keyword and vector search results.
    """
    scores = {}
    
    # Process BM25
    for rank, chunk in enumerate(bm25_results):
        chunk_id = chunk.get("id") or chunk.get("chunk_id")
        if not chunk_id: continue
        scores[chunk_id] = scores.get(chunk_id, 0) + 1 / (rank + k)

    # Process Vector
    for rank, chunk in enumerate(vector_results):
        chunk_id = chunk.get("id") or chunk.get("chunk_id")
        if not chunk_id: continue
        scores[chunk_id] = scores.get(chunk_id, 0) + 1 / (rank + k)

    # Combine metadata
    all_chunks = { (c.get("id") or c.get("chunk_id")): c for c in bm25_results + vector_results }
    
    # Sort by fused score
    fused_results = []
    for chunk_id, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        chunk = all_chunks[chunk_id].copy()
        chunk["fused_score"] = score
        fused_results.append(chunk)
        
    return fused_results
