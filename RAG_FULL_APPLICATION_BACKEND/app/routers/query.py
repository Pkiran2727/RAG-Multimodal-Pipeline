from fastapi import APIRouter, Depends, HTTPException
from ..models.schemas import QueryRequest, QueryResponse
from ..routers.ingest import get_current_user
from ..techniques.hybrid_search import HybridSearch
from ..techniques.reranking import ReRanking
from ..techniques.query_expansion import QueryExpansion
from ..techniques.metadata_filter import MetadataFilter
from ..techniques.colbert import ColBERT
from ..techniques.agentic_rag import AgenticRAG
from ..techniques.cache_incremental import CacheIncrementalRAG
import uuid
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

TECHNIQUE_MAP = {
    "hybrid": HybridSearch,
    "rerank": ReRanking,
    "hyde": QueryExpansion,
    "meta": MetadataFilter,
    "colbert": ColBERT,
    "agentic": AgenticRAG,
    "cache": CacheIncrementalRAG
}

@router.post("/search", response_model=QueryResponse)
async def search(
    request: QueryRequest,
    user: dict = Depends(get_current_user)
):
    job_id = str(uuid.uuid4())
    technique_cls = TECHNIQUE_MAP.get(request.technique)
    
    if not technique_cls:
        raise HTTPException(status_code=400, detail="Invalid technique")
        
    try:
        # Instantiate technique
        instance = technique_cls(job_id, user["id"])
        
        # Run pipeline
        # Passing extra filters if technique is metadata_filter
        result = await instance.run(
            query=request.query, 
            document_id=request.document_id,
            top_k=request.top_k,
            filters=request.filters,
            underlying_technique="hybrid" # for cache technique
        )
        
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            job_id=job_id
        )
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
