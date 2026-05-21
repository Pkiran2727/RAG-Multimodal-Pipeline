import tiktoken
import httpx, json_repair, json
import asyncio
from typing import List, Dict, Any
from ..config import settings
from ..utils.json_utils import repair_json
from gradio_client import Client
import logging

logger = logging.getLogger(__name__)
enc = tiktoken.get_encoding("cl100k_base")

_gradio_client = None
_fallback_model = None

def get_gradio_client():
    global _gradio_client
    if _gradio_client is None:
        logger.info(f"Initializing Gradio client for {settings.EMBED_API_URL}")
        _gradio_client = Client(settings.EMBED_API_URL)
    return _gradio_client

def truncate_to_1k(text: str) -> str:
    tokens = enc.encode(text)
    if len(tokens) > 1000:
        return enc.decode(tokens[:1000])
    return text

def get_fallback_model():
    global _fallback_model
    if _fallback_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Initializing fallback local embedding model (bge-large-en-v1.5)...")
        _fallback_model = SentenceTransformer('BAAI/bge-large-en-v1.5')
        dim = _fallback_model.get_sentence_embedding_dimension()
        logger.info(f"Fallback model initialized. Dimension: {dim}")
    return _fallback_model

def get_embedding(text: str) -> List[float]:
    """
    Get embedding using bge-m3 / snowflake via HF Space (Primary)
    Falls back to all-MiniLM-L6-v2 (Local) if API fails.
    """
    text = truncate_to_1k(text)
    
    # Attempt 1: Gradio Client
    try:
        client = get_gradio_client()
        result = client.predict(
            user_input=text,
            selected_model=settings.EMBED_MODEL,
            auth_key=settings.EMBED_AUTH_KEY,
            api_name="/call_embeddings_api"
        )
        
        if isinstance(result, str):
            data = repair_json(result)
        else:
            data = result
            
        if isinstance(data, list): return data
        if isinstance(data, dict) and "data" in data:
            d = data["data"]
            if isinstance(d, list) and len(d) > 0:
                if isinstance(d[0], dict) and "embedding" in d[0]:
                    emb = d[0]["embedding"]
                    logger.info(f"Primary API generated vector of length: {len(emb)}")
                    return emb
                if isinstance(d[0], list):
                    logger.info(f"Primary API generated vector of length: {len(d[0])}")
                    return d[0]
                logger.info(f"Primary API generated vector of length: {len(d)}")
                return d
        raise ValueError("Unknown API response format")
        
    except Exception as e:
        logger.warning(f"Primary embedding failed: {e}. Falling back to local model...")
        model = get_fallback_model()
        emb = model.encode(text).tolist()
        logger.info(f"Generated embedding vector of length: {len(emb)}")
        return emb

async def embed_batch(texts: List[str]) -> List[List[float]]:
    """
    Batch embedding for ingestion.
    """
    all_embeddings = []
    for text in texts:
        emb = await asyncio.to_thread(get_embedding, text)
        all_embeddings.append(emb)
    return all_embeddings
