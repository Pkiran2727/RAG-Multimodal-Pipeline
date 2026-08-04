from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..services.advanced_services import (
    graph_rag_service, 
    contextual_retrieval_service, 
    corrective_rag_service, 
    guardrails_service
)
from ..routers.ingest import get_current_user


router = APIRouter(prefix="/advanced", tags=["advanced"])

class GraphExtractRequest(BaseModel):
    text: str

class ContextualPreviewRequest(BaseModel):
    doc_summary: str
    chunk_text: str

class CRAGEvalRequest(BaseModel):
    query: str
    chunks: List[Dict[str, Any]]

class GuardrailsCheckRequest(BaseModel):
    query: str
    answer: str
    chunks: List[Dict[str, Any]]

@router.post("/graph")
async def extract_graph_nodes(req: GraphExtractRequest, user=Depends(get_current_user)):
    """Extract Knowledge Graph Nodes & Edges from text."""
    if not req.text:
        raise HTTPException(status_code=400, detail="Text required")
    return graph_rag_service.extract_graph(req.text)

@router.post("/contextual")
async def preview_contextual_chunk(req: ContextualPreviewRequest, user=Depends(get_current_user)):
    """Generate Contextual Chunk with prepended document summary."""
    contextual_text = contextual_retrieval_service.generate_contextual_chunk(req.doc_summary, req.chunk_text)
    return {"contextual_chunk": contextual_text}

@router.post("/crag")
async def evaluate_crag_fallback(req: CRAGEvalRequest, user=Depends(get_current_user)):
    """Evaluate Corrective RAG (CRAG) internal chunk confidence and trigger Web Search fallback if low."""
    return corrective_rag_service.evaluate_and_correct(req.query, req.chunks)

@router.post("/guardrails")
async def check_guardrails(req: GuardrailsCheckRequest, user=Depends(get_current_user)):
    """Inspect query & response safety, prompt injection, and hallucination risk."""
    return guardrails_service.inspect_guardrails(req.query, req.answer, req.chunks)
