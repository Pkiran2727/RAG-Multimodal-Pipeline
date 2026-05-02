from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException, Form
from fastapi.security import OAuth2PasswordBearer
from ..services.supabase_client import supabase_service
from ..services.file_parser import parse_file
from ..services.chunk_engine import ChunkEngine
from ..services.embed_service import embed_batch, get_embedding
from ..services.bm25_service import bm25_service
from ..utils.ws_manager import ws_manager
from ..utils.auth_utils import decode_token
import os
import uuid
import logging
from pathlib import Path

router = APIRouter()
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Auth Dependency — reads from Authorization: Bearer header
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    chunk_size: int = Form(512),
    overlap: int = Form(64),
    strategy: str = Form("fixed"),
    user: dict = Depends(get_current_user)
):
    job_id = str(uuid.uuid4())
    temp_dir = Path("./data/uploads") / user["id"]
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_path = temp_dir / file.filename
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Start ingestion in background
    background_tasks.add_task(
        process_ingestion, 
        str(file_path), 
        file.filename, 
        chunk_size, 
        overlap, 
        strategy, 
        job_id, 
        user["id"]
    )
    
    return {"job_id": job_id, "filename": file.filename}

@router.get("/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    try:
        result = supabase_service.client.table("documents")\
            .select("*")\
            .eq("user_id", user["id"])\
            .order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user_id: str = Depends(get_current_user)):
    try:
        # 1. Database cleanup
        await supabase_service.delete_document(doc_id, user_id["id"])
        # 2. BM25 cleanup
        bm25_service.delete_document(doc_id)
        return {"status": "success", "message": f"Document {doc_id} deleted"}
    except Exception as e:
        logger.error(f"Failed to delete document {doc_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_ingestion(file_path: str, filename: str, chunk_size: int, overlap: int, strategy: str, job_id: str, user_id: str):
    try:
        await ws_manager.emit(job_id, user_id, {"step": "START", "color": "#8B5CF6", "detail": f"Starting ingestion for {filename}..."})
        
        # 1. Parse
        file_type = filename.split(".")[-1]
        docs = await parse_file(file_path, file_type, job_id, ws_manager, user_id)
        
        # 2. Chunk
        await ws_manager.emit(job_id, user_id, {"step": "CHUNKING", "color": "#6B7280", "detail": f"Applying {strategy} chunking strategy..."})
        engine = ChunkEngine(chunk_size, overlap, strategy)
        chunks = engine.chunk(docs)
        
        # 3. Create Document entry
        doc_result = supabase_service.client.table("documents").insert({
            "user_id": user_id,
            "filename": filename,
            "file_type": file_type,
            "technique": "hybrid", # default
            "chunk_strategy": strategy,
            "chunk_size": chunk_size,
            "overlap": overlap,
            "status": "running",
            "chunk_count": len(chunks)
        }).execute()
        document_id = doc_result.data[0]["id"]
        
        # 4. Incremental Check & Embed
        await ws_manager.emit(job_id, user_id, {"step": "EMBEDDING", "color": "#8B5CF6", "detail": f"Vectorizing {len(chunks)} chunks..."})
        embeddings = await embed_batch([c["text"] for c in chunks])
        print(f"DEBUG: Embedding complete. First vector len: {len(embeddings[0]) if embeddings else 0}")
        
        # 5. Insert to Supabase
        await ws_manager.emit(job_id, user_id, {"step": "STORING", "color": "#22C55E", "detail": "Storing chunks and vectors in Supabase..."})
        
        # Prepare rows
        chunk_rows = []
        for i, c in enumerate(chunks):
            c["document_id"] = document_id
            c["user_id"] = user_id
            chunk_rows.append(c)
            
        chunk_ids = await supabase_service.insert_chunks(chunk_rows)
        
        vector_rows = []
        for i, cid in enumerate(chunk_ids):
            vector_rows.append({
                "chunk_id": cid,
                "document_id": document_id,
                "user_id": user_id,
                "embedding": embeddings[i]
            })
        await supabase_service.upsert_vectors(vector_rows)
        
        # 6. Index BM25
        await ws_manager.emit(job_id, user_id, {"step": "BM25_INDEX", "color": "#22C55E", "detail": "Building BM25 keyword index..."})
        bm25_service.index_chunks(document_id, chunk_rows)
        
        # Special check for ColBERT
        # if technique == "colbert": embed all tokens... (skipped for brevity in base ingest)
        
        supabase_service.client.table("documents").update({"status": "done"}).eq("id", document_id).execute()
        await ws_manager.emit(job_id, user_id, {"step": "DONE", "color": "#22C55E", "detail": "Ingestion complete!", "metadata": {"doc_id": document_id}})
        
    except Exception as e:
        import traceback
        logger.error(f"Ingestion failed: {e}")
        logger.error(traceback.format_exc())
        await ws_manager.emit(job_id, user_id, {"step": "ERROR", "color": "#EF4444", "detail": f"Ingestion failed: {str(e)}"})
        if 'document_id' in locals():
            supabase_service.client.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
    finally:
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
