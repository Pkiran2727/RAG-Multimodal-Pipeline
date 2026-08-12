from supabase import create_client, Client
from ..config import settings
from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_KEY
        )

    # ── Chunk Operations ────────────────────────────────────────────────
    async def insert_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        """Insert chunks, return list of chunk_ids"""
        if not chunks:
            return []
            
        # Define valid columns based on schema
        valid_cols = {"id", "document_id", "user_id", "text", "token_count", "page", "section", "chunk_index", "parent_chunk_id", "text_hash", "metadata"}
        
        cleaned_chunks = []
        for chunk in chunks:
            cleaned = {k: v for k, v in chunk.items() if k in valid_cols}
            cleaned_chunks.append(cleaned)
            
        try:
            result = self.client.table("chunks").insert(cleaned_chunks).execute()
            return [row["id"] for row in result.data]
        except Exception as e:
            logger.error(f"Supabase chunk insertion failed: {e}")
            raise

    async def get_chunks_by_ids(self, chunk_ids: List[str]) -> List[Dict[str, Any]]:
        """Fetch chunk text + metadata by IDs"""
        result = self.client.table("chunks").select("*").in_("id", chunk_ids).execute()
        return result.data

    async def get_chunk_hashes(self, document_id: str) -> Dict[int, str]:
        """Returns {chunk_index: text_hash} for incremental ingest"""
        result = self.client.table("chunks")\
            .select("chunk_index, text_hash")\
            .eq("document_id", document_id).execute()
        return {row["chunk_index"]: row["text_hash"] for row in result.data}

    async def delete_chunks(self, chunk_ids: List[str]):
        """Delete chunks + their vectors (CASCADE)"""
        if chunk_ids:
            self.client.table("chunks").delete().in_("id", chunk_ids).execute()

    # ── Vector Operations ───────────────────────────────────────────────
    async def upsert_vectors(self, vectors: List[Dict[str, Any]]):
        if not vectors:
            return
        self.client.table("chunk_vectors").insert(vectors).execute()

    async def vector_search(self, query_embedding: List[float],
                             document_id: str, user_id: str,
                             top_k: int, filter_chunk_ids: List[str] = None
                             ) -> List[Dict[str, Any]]:
        """
        Calls match_chunks() SQL function.
        Returns: [{chunk_id, text, source, page, section, metadata, similarity}]
        """
        params = {
            "query_embedding": query_embedding,
            "match_document_id": document_id,
            "match_user_id": user_id,
            "match_count": top_k,
            "filter_chunk_ids": filter_chunk_ids
        }
        result = self.client.rpc("match_chunks", params).execute()
        return result.data

    # ── Metadata Filter ─────────────────────────────────────────────────
    async def filter_chunk_ids(self, document_id: str, user_id: str, filters: Dict[str, Any]) -> List[str]:
        """
        Filter chunks by metadata fields using Supabase filter logic.
        Simplified example: filters is a dict of exact matches.
        """
        query = self.client.table("chunks").select("id").eq("document_id", document_id).eq("user_id", user_id)
        
        for key, value in filters.items():
            if isinstance(value, dict):
                # Handle gte, lte, etc.
                if "gte" in value: query = query.gte(f"metadata->>{key}", value["gte"])
                if "lte" in value: query = query.lte(f"metadata->>{key}", value["lte"])
            else:
                query = query.eq(f"metadata->>{key}", value)
        
        result = query.execute()
        return [row["id"] for row in result.data]

    # ── ColBERT Token Vectors ───────────────────────────────────────────
    async def insert_colbert_tokens(self, token_rows: List[Dict[str, Any]]):
        if not token_rows:
            return
        self.client.table("colbert_tokens").insert(token_rows).execute()

    async def get_colbert_tokens(self, document_id: str) -> List[Dict[str, Any]]:
        """Fetch all token vectors for MaxSim scoring"""
        result = self.client.table("colbert_tokens")\
            .select("chunk_id, embedding")\
            .eq("document_id", document_id).execute()
        return result.data

    async def delete_document(self, document_id: str, user_id: str):
        """Delete document + chunks + vectors + colbert tokens (CASCADE)"""
        try:
            # 1. Delete vector embeddings
            try:
                self.client.table("chunk_vectors").delete().eq("document_id", document_id).eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"chunk_vectors delete notice: {e}")

            # 2. Delete colbert tokens
            try:
                self.client.table("colbert_tokens").delete().eq("document_id", document_id).execute()
            except Exception as e:
                logger.warning(f"colbert_tokens delete notice: {e}")

            # 3. Delete chunks
            try:
                self.client.table("chunks").delete().eq("document_id", document_id).eq("user_id", user_id).execute()
            except Exception as e:
                logger.warning(f"chunks delete notice: {e}")

            # 4. Delete document entry
            result = self.client.table("documents").delete().eq("id", document_id).eq("user_id", user_id).execute()
            logger.info(f"Document {document_id} and all associated embeddings deleted from Supabase.")
            return result
        except Exception as e:
            logger.error(f"Failed to delete document {document_id}: {e}")
            raise

supabase_service = SupabaseService()
