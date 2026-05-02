from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .utils.ws_manager import ws_manager
import logging

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Pipeline API", version="3.0.0")

# CORS
origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import auth, ingest, query

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(query.router, prefix="/query", tags=["query"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0"}

@app.websocket("/ws/pipeline/{job_id}")
async def pipeline_ws(websocket: WebSocket, job_id: str, token: str):
    # JWT verification logic will go here
    # For now, just connect
    await ws_manager.connect(job_id, websocket, "anonymous")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle messages if needed
    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {e}")
    finally:
        await ws_manager.disconnect(job_id, "anonymous")
