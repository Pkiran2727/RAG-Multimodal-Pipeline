from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from ..services.supabase_client import supabase_service
from ..services.embed_service import get_embedding, truncate_to_1k
from ..services.llm_service import llm_service
from ..utils.ws_manager import ws_manager
import logging

logger = logging.getLogger(__name__)

class BaseRAGTechnique(ABC):
    def __init__(self, job_id: str, user_id: str):
        self.job_id = job_id
        self.user_id = user_id
        self.supabase = supabase_service
        self.llm = llm_service

    def build_prompt(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        context = "\n\n".join([c["text"] for c in chunks])
        return f"""Context:
{context}

Question: {query}

Instructions:
1. If the user is just saying a general greeting (e.g., "hi", "hello"), respond politely without using the context.
2. If the user asks a general question about the document itself (e.g., "what is this document about?", "summarize"), summarize the provided context to answer.
3. Otherwise, answer the question based ONLY on the provided context. If the answer is not in the context, state that clearly."""

    @abstractmethod
    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        pass

    async def run(self, query: str, document_id: str, top_k: int = 5, **kwargs) -> Dict[str, Any]:
        """Execute the full RAG pipeline."""
        try:
            # 1. Retrieval
            chunks = await self.retrieve(query, document_id, top_k, **kwargs)
            
            # 2. Generation
            answer = await self.generate(query, chunks)
            
            return {
                "answer": answer,
                "sources": chunks,
                "job_id": self.job_id
            }
        except Exception as e:
            logger.error(f"RAG execution failed: {e}")
            await self.emit("ERROR", "red", f"Critical error: {str(e)}")
            raise

    async def emit(self, step: str, color: str, detail: str, metadata: dict = {}):
        """Broadcast progress to frontend."""
        await ws_manager.emit(self.job_id, self.user_id, {
            "step": step,
            "status": "running",
            "color": color,
            "detail": detail,
            "metadata": metadata
        })
