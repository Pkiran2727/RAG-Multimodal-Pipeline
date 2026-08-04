from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import settings
from .utils.ws_manager import ws_manager
import logging
import os

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RAG Pipeline API", version="3.0.0")

# CORS
# origins = settings.CORS_ORIGINS.split(",")
origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import auth, ingest, query, advanced, vectordb

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(query.router, prefix="/query", tags=["query"])
app.include_router(advanced.router)
app.include_router(vectordb.router)


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

# Serve frontend static files in production monolith
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        # Prevent catching API calls
        if catchall.startswith(("auth", "ingest", "query", "health", "ws")):
            return None
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
