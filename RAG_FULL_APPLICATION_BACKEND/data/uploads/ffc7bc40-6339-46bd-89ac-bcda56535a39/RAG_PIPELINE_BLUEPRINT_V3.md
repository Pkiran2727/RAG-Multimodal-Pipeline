# 🧠 RAG Pipeline — Production Blueprint V3 (100% Free)

> **Stack:** FastAPI · React · Supabase pgvector · bge-m3 (HF Space) · Qwen3 · Mistral OCR · Ernie Bot  
> **Deploy:** Netlify (Frontend) · Render (Backend) · Supabase (DB + Vectors)  
> **Cost:** $0.00  
> **Theme:** Green (#22C55E) + Violet (#8B5CF6)

---

## 📑 Table of Contents
1. [Full System Architecture](#1-full-system-architecture)
2. [Tech Stack — All Free](#2-tech-stack--all-free)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Supabase Setup](#4-supabase-setup)
5. [Backend — FastAPI Deep Dive](#5-backend--fastapi-deep-dive)
6. [File Processing — All Types](#6-file-processing--all-types)
7. [Chunking Engine — 6 Strategies](#7-chunking-engine--6-strategies)
8. [Embedding Service](#8-embedding-service)
9. [All 8 RAG Techniques](#9-all-8-rag-techniques)
10. [Multi-User Architecture](#10-multi-user-architecture)
11. [API Endpoints](#11-api-endpoints)
12. [Frontend — React Deep Dive](#12-frontend--react-deep-dive)
13. [Docker Setup](#13-docker-setup)
14. [Environment Variables](#14-environment-variables)
15. [Deployment Guide](#15-deployment-guide)
16. [Production Additions](#16-production-additions)

---

## 1. Full System Architecture

```
┌─────────────────────────────────────────────────────┐
│           NETLIFY — React Frontend                   │
│  Upload → Technique Select → Chunk Config → Query   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS + WSS
┌────────────────────▼────────────────────────────────┐
│           RENDER — FastAPI Backend                   │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ /ingest  │ │ /query   │ │ /evaluate│            │
│  └──────────┘ └──────────┘ └──────────┘            │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │             Core Services                      │ │
│  │  FileParser · ChunkEngine · EmbedService       │ │
│  │  LLMService · OCRService · ReRankService       │ │
│  │  SupabaseClient · CacheService · BM25Service   │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Redis (Render free)     Docker container            │
└──────┬──────────┬────────────────┬───────────────────┘
       │          │                │
       ▼          ▼                ▼
┌──────────┐ ┌─────────────┐ ┌──────────────────────┐
│ Supabase │ │  HF Spaces  │ │  HF Spaces           │
│          │ │             │ │                      │
│ pgvector │ │ bge-m3      │ │ Qwen3 (LLM)          │
│ postgres │ │ embeddings  │ │ Mistral OCR (PDF/img) │
│ metadata │ │ (free)      │ │ Ernie Bot (images)   │
│ users    │ │             │ │                      │
│ chunks   │ │ 1K tok cap  │ │                      │
│ cache    │ └─────────────┘ └──────────────────────┘
└──────────┘
```

---

## 2. Tech Stack — All Free

| Layer | Technology | Free Tier |
|-------|-----------|-----------|
| Vector DB | Supabase pgvector | 500MB, unlimited rows |
| Metadata DB | Supabase PostgreSQL | Same instance |
| Embeddings | `lamhieu-lightweight-embeddings.hf.space` bge-m3 | Free HF Space |
| LLM | Qwen3 `Qwen/Qwen3-Demo` | Free HF Space |
| PDF/Image OCR | Mistral OCR `tatendachirume/Mistral-OCR` | Free HF Space |
| Image Understanding | Ernie Bot `baidu-simple-ernie-bot-demo` | Free HF Space |
| Re-ranking | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Runs on Render CPU |
| Backend | Render free tier | 512MB RAM |
| Frontend | Netlify free tier | 100GB bandwidth |
| Cache | Render Redis free | 25MB |
| Containers | Docker + docker-compose | Local dev |

---

## 3. Monorepo Structure

```
rag-pipeline/
│
├── backend/                          ← Render deployment
│   ├── app/
│   │   ├── main.py                   # FastAPI app factory
│   │   ├── config.py                 # pydantic-settings
│   │   ├── dependencies.py           # DI: supabase, redis, etc.
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py               # register, login, refresh
│   │   │   ├── ingest.py             # upload, status, documents
│   │   │   ├── query.py              # search, history, cache
│   │   │   ├── techniques.py         # list techniques
│   │   │   ├── evaluate.py           # RAGAs run + report
│   │   │   └── stats.py              # index stats
│   │   │
│   │   ├── services/
│   │   │   ├── supabase_client.py    # Supabase vector + metadata ops
│   │   │   ├── embed_service.py      # bge-m3 via HF Space
│   │   │   ├── llm_service.py        # Qwen3 (your existing code)
│   │   │   ├── ocr_service.py        # Mistral OCR (your existing code)
│   │   │   ├── ernie_service.py      # Ernie Bot (your existing code)
│   │   │   ├── file_parser.py        # dispatcher for all file types
│   │   │   ├── chunk_engine.py       # 6 chunking strategies
│   │   │   ├── bm25_service.py       # keyword search (rank_bm25)
│   │   │   ├── rerank_service.py     # cross-encoder re-ranking
│   │   │   └── cache_service.py      # Redis query cache
│   │   │
│   │   ├── techniques/
│   │   │   ├── base.py               # abstract base + emit_step
│   │   │   ├── hybrid_search.py      # BM25 + pgvector → RRF
│   │   │   ├── reranking.py          # ANN → cross-encoder
│   │   │   ├── query_expansion.py    # HyDE + multi-query
│   │   │   ├── metadata_filter.py    # SQL filter + vector search
│   │   │   ├── colbert.py            # token-level MaxSim
│   │   │   ├── agentic_rag.py        # Qwen3 tool-calling agent
│   │   │   ├── cache_incremental.py  # Redis cache + delta ingest
│   │   │   └── ragas_eval.py         # RAGAs evaluation
│   │   │
│   │   ├── models/
│   │   │   ├── schemas.py            # Pydantic request/response
│   │   │   └── enums.py              # TechniqueType, FileType, etc.
│   │   │
│   │   └── utils/
│   │       ├── logger.py             # print_with_time (loguru)
│   │       ├── json_utils.py         # extract_json_block, repair_json
│   │       ├── retry_utils.py        # thread timeout + retry decorator
│   │       ├── hash_utils.py         # SHA-256 chunk hashing
│   │       └── ws_manager.py         # WebSocket multi-user manager
│   │
│   ├── tests/
│   │   ├── test_ingest.py
│   │   ├── test_query.py
│   │   ├── test_techniques.py
│   │   └── test_parsers.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile                    # Render uses this
│   └── .env.example                  # key names only, no values
│
├── frontend/                         ← Netlify deployment
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # auth + hero (green/violet)
│   │   │   ├── DashboardPage.jsx     # document list
│   │   │   ├── PipelinePage.jsx      # main RAG UI
│   │   │   └── EvaluatePage.jsx      # RAGAs metrics dashboard
│   │   ├── components/
│   │   │   ├── upload/
│   │   │   │   ├── FileDropZone.jsx  # drag & drop, all file types
│   │   │   │   └── UploadProgress.jsx
│   │   │   ├── pipeline/
│   │   │   │   ├── PipelineVisualizer.jsx  # animated step trace
│   │   │   │   ├── StepCard.jsx            # green/violet step cards
│   │   │   │   ├── ChunkSliders.jsx        # chunk + overlap sliders
│   │   │   │   └── TechniqueSelector.jsx   # 8 technique cards
│   │   │   ├── query/
│   │   │   │   ├── QueryInput.jsx
│   │   │   │   ├── AnswerPanel.jsx
│   │   │   │   └── SourceChunks.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   └── evaluate/
│   │   │       ├── MetricsRadar.jsx  # Recharts radar chart
│   │   │       └── EvalTable.jsx
│   │   ├── store/
│   │   │   ├── authStore.js          # JWT in-memory (NOT localStorage)
│   │   │   ├── pipelineStore.js
│   │   │   └── documentStore.js
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useUpload.js
│   │   │   ├── useQuery.js
│   │   │   └── usePipelineWS.js      # WebSocket real-time steps
│   │   ├── api/
│   │   │   └── client.js             # Axios + JWT interceptor
│   │   └── utils/
│   │       ├── stepColors.js         # step → green/violet colors
│   │       └── fileIcons.js
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js            # green + violet theme
│   ├── netlify.toml
│   └── .env.example
│
├── docker-compose.yml                ← Local dev only
├── .gitignore
└── README.md
```

---

## 4. Supabase Setup

### Why Supabase (not raw PostgreSQL)

- Free 500MB, no credit card
- pgvector built-in (vector similarity search)
- Replaces both FAISS and SQLite in one service
- REST + Python client available

### Database Schema (all tables in one Supabase project)

```sql
-- Users (multi-user support)
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (one row per uploaded file)
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    file_type       TEXT NOT NULL,
    technique       TEXT NOT NULL,
    chunk_strategy  TEXT NOT NULL,
    chunk_size      INT DEFAULT 512,
    overlap         INT DEFAULT 64,
    status          TEXT DEFAULT 'pending', -- pending|running|done|failed
    chunk_count     INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks (text + metadata per chunk)
CREATE TABLE chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    token_count     INT,
    source          TEXT,          -- original filename
    page            INT,           -- page number (PDF)
    section         TEXT,          -- heading (DOCX/MD)
    chunk_index     INT,
    parent_chunk_id UUID,          -- for parent-child chunking
    text_hash       TEXT,          -- SHA-256 for incremental ingest
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Vectors (pgvector — bge-m3 dim=1024)
CREATE TABLE chunk_vectors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id    UUID REFERENCES chunks(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    embedding   vector(1024) NOT NULL
);

-- HNSW index for fast ANN search
CREATE INDEX ON chunk_vectors
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ColBERT token vectors (only populated when ColBERT technique used)
CREATE TABLE colbert_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id    UUID REFERENCES chunks(id) ON DELETE CASCADE,
    token_text  TEXT,
    position    INT,
    embedding   vector(1024) NOT NULL
);

-- Query cache (also stored in Redis, Supabase as overflow)
CREATE TABLE query_cache (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id  UUID REFERENCES documents(id) ON DELETE CASCADE,
    query_hash   TEXT NOT NULL,
    query_text   TEXT,
    answer       TEXT,
    sources      JSONB,
    technique    TEXT,
    hit_count    INT DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RAGAs evaluation reports
CREATE TABLE eval_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    faithfulness    FLOAT,
    answer_relevancy FLOAT,
    context_precision FLOAT,
    context_recall  FLOAT,
    per_question    JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase Vector Search Function

```sql
-- Used by all retrieval techniques
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(1024),
    match_document_id UUID,
    match_user_id UUID,
    match_count INT DEFAULT 5,
    filter_chunk_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    text TEXT,
    source TEXT,
    page INT,
    section TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.text,
        c.source,
        c.page,
        c.section,
        c.metadata,
        1 - (cv.embedding <=> query_embedding) AS similarity
    FROM chunk_vectors cv
    JOIN chunks c ON c.id = cv.chunk_id
    WHERE cv.document_id = match_document_id
      AND cv.user_id = match_user_id
      AND (filter_chunk_ids IS NULL OR c.id = ANY(filter_chunk_ids))
    ORDER BY cv.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

## 5. Backend — FastAPI Deep Dive

### `app/main.py`

```python
# Key responsibilities:
# - FastAPI app with CORS for Netlify origin
# - Mount all routers
# - Startup: init Supabase client, Redis, load cross-encoder
# - Shutdown: flush Redis pipeline
# - WebSocket: /ws/pipeline/{job_id}?token={jwt}

app = FastAPI(title="RAG Pipeline API", version="3.0.0")

# CORS — Netlify + local dev
origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_methods=["*"], allow_headers=["*"])

# Routers
app.include_router(auth_router,      prefix="/auth")
app.include_router(ingest_router,    prefix="/ingest")
app.include_router(query_router,     prefix="/query")
app.include_router(technique_router, prefix="/techniques")
app.include_router(evaluate_router,  prefix="/evaluate")
app.include_router(stats_router,     prefix="/stats")

@app.websocket("/ws/pipeline/{job_id}")
async def pipeline_ws(websocket, job_id, token):
    # Verify JWT, then stream pipeline step events
    ...
```

### `app/config.py`

```python
class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str           # https://xxxx.supabase.co
    SUPABASE_KEY: str           # anon/service_role key
    SUPABASE_DB_URL: str        # postgresql://... (direct connection)

    # Embeddings (your existing HF Space)
    EMBED_API_URL: str = "https://lamhieu-lightweight-embeddings.hf.space/"
    EMBED_MODEL: str = "bge-m3"
    EMBED_DIM: int = 1024
    EMBED_AUTH_KEY: str = ""
    EMBED_MAX_TOKENS: int = 1000   # hard cap — 1K context
    EMBED_TIMEOUT: int = 60
    EMBED_MAX_RETRIES: int = 3

    # LLM — Qwen3
    QWEN3_MODEL_NAME: str = "Qwen/Qwen3-Demo"
    QWEN3_THINKING_BUDGET: int = 38
    LLM_RESPONSE_TIMEOUT: int = 1080
    MAX_LLM_RETRIES: int = 5
    MAX_TIMEOUT_RETRIES: int = 10

    # OCR — Mistral
    MISTRAL_OCR_SPACE: str = "tatendachirume/Mistral-OCR"
    MISTRAL_API_KEY: str

    # Image — Ernie Bot
    ERNIE_SPACE_URL: str = "https://baidu-simple-ernie-bot-demo.hf.space/"

    # Redis
    REDIS_URL: str
    CACHE_TTL_SECONDS: int = 3600

    # Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # Re-ranking
    RERANK_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 20
    RATE_LIMIT_UPLOAD_PER_DAY: int = 50

    # Defaults
    DEFAULT_CHUNK_SIZE: int = 512
    DEFAULT_OVERLAP: int = 64
    DEFAULT_TOP_K: int = 5
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    CORS_ORIGINS: str  # comma-separated
```

### `app/services/supabase_client.py`

```python
"""
Central Supabase service.
Handles: vector upsert, ANN search, chunk CRUD, metadata queries.
Uses supabase-py client + asyncpg for direct SQL when needed.
"""
from supabase import create_client, Client

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_KEY
        )

    # ── Chunk Operations ────────────────────────────────────────────────
    async def insert_chunks(self, chunks: list[dict]) -> list[str]:
        """Insert chunks, return list of chunk_ids"""

    async def get_chunks_by_ids(self, chunk_ids: list[str]) -> list[dict]:
        """Fetch chunk text + metadata by IDs"""

    async def get_chunk_hashes(self, document_id: str) -> dict[str, str]:
        """Returns {chunk_index: text_hash} for incremental ingest"""

    async def delete_chunks(self, chunk_ids: list[str]):
        """Delete chunks + their vectors (CASCADE)"""

    # ── Vector Operations ───────────────────────────────────────────────
    async def upsert_vectors(self, vectors: list[dict]):
        """
        vectors: [{"chunk_id": uuid, "document_id": uuid,
                   "user_id": uuid, "embedding": [...1024 floats...]}]
        """

    async def vector_search(self, query_embedding: list[float],
                             document_id: str, user_id: str,
                             top_k: int, filter_chunk_ids: list = None
                             ) -> list[dict]:
        """
        Calls match_chunks() SQL function.
        Returns: [{chunk_id, text, source, page, section, metadata, similarity}]
        """
        result = self.client.rpc("match_chunks", {
            "query_embedding": query_embedding,
            "match_document_id": document_id,
            "match_user_id": user_id,
            "match_count": top_k,
            "filter_chunk_ids": filter_chunk_ids
        }).execute()
        return result.data

    # ── Metadata Filter ─────────────────────────────────────────────────
    async def filter_chunk_ids(self, document_id: str, filters: dict) -> list[str]:
        """
        Filter chunks by metadata fields.
        filters: {"page": {"gte": 5, "lte": 10}, "section": "Intro"}
        Returns list of chunk_ids matching the filter.
        """

    # ── ColBERT Token Vectors ───────────────────────────────────────────
    async def insert_colbert_tokens(self, token_rows: list[dict]):
        """Store token-level vectors for ColBERT technique"""

    async def get_colbert_tokens(self, document_id: str) -> list[dict]:
        """Fetch all token vectors for MaxSim scoring"""

    # ── Cache ────────────────────────────────────────────────────────────
    async def get_cached_query(self, user_id: str,
                                document_id: str, query_hash: str) -> dict | None:
        """Check Supabase query_cache table (overflow from Redis)"""

    async def store_cached_query(self, cache_row: dict):
        """Store answer in query_cache table"""
```

### `app/services/embed_service.py` — Your exact code, integrated

```python
"""
Direct port of your get_embedding_with_retry() function.
Extended to support batch embedding for ingestion.
1K token hard cap applied before every call.
"""
import tiktoken
enc = tiktoken.get_encoding("cl100k_base")

def truncate_to_1k(text: str) -> str:
    tokens = enc.encode(text)
    return enc.decode(tokens[:1000]) if len(tokens) > 1000 else text

def get_embedding(text: str) -> list[float]:
    """
    Your existing get_embedding_with_retry() — unchanged.
    Truncates to 1K tokens before calling HF Space.
    Model: bge-m3, dim: 1024
    """
    text = truncate_to_1k(text)
    # ... your exact code from get_embedding_with_retry()

async def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Batch embedding for ingestion.
    Processes sequentially in groups of 8 (HF Space rate limit safety).
    Each text truncated to 1K tokens.
    """
    all_embeddings = []
    for i in range(0, len(texts), 8):
        batch = [truncate_to_1k(t) for t in texts[i:i+8]]
        for text in batch:
            emb = get_embedding(text)
            all_embeddings.append(emb)
    return all_embeddings
```

---

## 6. File Processing — All Types

```
PDF        → Mistral OCR (your perform_ocr()) → text per page
JPG/PNG/JPEG → Ernie Bot (your ernie code)    → image description text
DOCX       → python-docx                      → paragraphs by heading
TXT        → raw read                         → paragraph split
MD         → regex heading split              → section chunks
JSON       → flatten keys/values              → one text per item
```

### `app/services/file_parser.py`

```python
async def parse_file(file_path, file_type, job_id, ws_manager) -> list[dict]:
    """
    Returns: [{"text": str, "metadata": {"source", "page", "section"}}]
    Emits WebSocket steps for every file type.
    """
    match file_type:
        case "pdf":
            return await parse_pdf(file_path, job_id, ws_manager)
        case "jpg" | "jpeg" | "png":
            return await parse_image(file_path, job_id, ws_manager)
        case "docx":
            return parse_docx(file_path)
        case "txt":
            return parse_txt(file_path)
        case "md":
            return parse_markdown(file_path)
        case "json":
            return parse_json(file_path)

# PDF — uses your perform_ocr() unchanged
async def parse_pdf(file_path, job_id, ws_manager):
    await ws_manager.emit(job_id, step="OCR_START", color="#8B5CF6",
        detail=f"Sending to Mistral OCR...")
    plain_text, markdown_text, images = perform_ocr(
        file_path, api_key=settings.MISTRAL_API_KEY)
    await ws_manager.emit(job_id, step="OCR_DONE", color="#22C55E",
        detail=f"OCR complete: {len(plain_text)} chars")
    return split_to_pages(plain_text, markdown_text, str(file_path))

# Image — uses your Ernie Bot code unchanged
async def parse_image(file_path, job_id, ws_manager):
    await ws_manager.emit(job_id, step="IMAGE_ANALYZE", color="#8B5CF6",
        detail="Ernie Bot analyzing image...")
    description = understand_image(file_path)
    return [{"text": description, "metadata": {"source": str(file_path), "page": 1}}]

# DOCX — python-docx, split by headings
def parse_docx(file_path):
    doc = Document(file_path)
    sections, current_heading, current_text = [], "", []
    for para in doc.paragraphs:
        if para.style.name.startswith('Heading'):
            if current_text:
                sections.append({"text": " ".join(current_text),
                                  "metadata": {"source": str(file_path),
                                               "section": current_heading}})
            current_heading, current_text = para.text, []
        elif para.text.strip():
            current_text.append(para.text)
    if current_text:
        sections.append({"text": " ".join(current_text),
                         "metadata": {"source": str(file_path),
                                      "section": current_heading}})
    return sections

# MD — split at headings
def parse_markdown(file_path):
    text = Path(file_path).read_text(encoding="utf-8")
    parts = re.split(r'\n(?=#+\s)', text)
    return [{"text": p.strip(), "metadata": {"source": str(file_path),
             "section": re.match(r'^#+\s+(.*)', p).group(1) if re.match(r'^#+\s', p) else ""}}
            for p in parts if p.strip()]

# TXT — paragraph split
def parse_txt(file_path):
    text = Path(file_path).read_text(encoding="utf-8")
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    return [{"text": p, "metadata": {"source": str(file_path)}} for p in paragraphs]

# JSON — flatten per item
def parse_json(file_path):
    data = json.loads(Path(file_path).read_text())
    items = data if isinstance(data, list) else [data]
    docs = []
    for item in items:
        def flatten(obj, prefix=""):
            parts = []
            for k, v in obj.items() if isinstance(obj, dict) else enumerate(obj):
                full_key = f"{prefix}.{k}" if prefix else str(k)
                if isinstance(v, (dict, list)):
                    parts.extend(flatten(v, full_key))
                else:
                    parts.append(f"{full_key}: {v}")
            return parts
        text = " | ".join(flatten(item))
        docs.append({"text": text, "metadata": {"source": str(file_path),
                     "original": item}})
    return docs
```

---

## 7. Chunking Engine — 6 Strategies

```python
"""
All strategies hard-cap at 1K tokens per chunk.
bge-m3 recommended context: up to 8192, but we cap at 1K for speed/cost.
"""
MAX_CHUNK_TOKENS = 1000

class ChunkEngine:
    def __init__(self, chunk_size: int, overlap: int, strategy: str):
        self.chunk_size = min(chunk_size, MAX_CHUNK_TOKENS)
        self.overlap = min(overlap, self.chunk_size // 4)
        self.strategy = strategy
        self.enc = tiktoken.get_encoding("cl100k_base")

    def chunk(self, docs: list[dict]) -> list[dict]:
        # Each output chunk:
        # {chunk_id, text, token_count, source, page, section,
        #  chunk_index, parent_chunk_id, text_hash, metadata}
        match self.strategy:
            case "fixed":        return self._fixed(docs)
            case "semantic":     return self._semantic(docs)
            case "per_page":     return self._per_page(docs)
            case "per_item":     return self._per_item(docs)
            case "recursive":    return self._recursive(docs)
            case "parent_child": return self._parent_child(docs)

    def _fixed(self, docs):
        """Sliding window: step = chunk_size - overlap. Token-accurate."""

    def _semantic(self, docs):
        """Use heading sections as natural boundaries. Fixed fallback if too large."""

    def _per_page(self, docs):
        """One chunk per PDF page. Fixed fallback for long pages."""

    def _per_item(self, docs):
        """One chunk per JSON item (parser already splits)."""

    def _recursive(self, docs):
        """Split at: \\n\\n → \\n → '. ' → ' ' until fits in chunk_size."""

    def _parent_child(self, docs):
        """
        child:  chunk_size // 4 tokens → stored in Supabase, used for retrieval
        parent: chunk_size tokens     → stored in Supabase, sent to LLM
        child.parent_chunk_id → parent.id
        """
```

---

## 8. Embedding Service

```python
# app/services/embed_service.py
# Your exact get_embedding_with_retry() function — zero changes
# Calling convention matches your existing code:
#
# get_embedding_with_retry(
#     text=text,
#     model="bge-m3",
#     auth_key=settings.EMBED_AUTH_KEY,
#     max_retries=settings.EMBED_MAX_RETRIES,
#     timeout_seconds=settings.EMBED_TIMEOUT
# )
#
# Returns: {"data": [[...1024 floats...]], "usage": {...}}
# We extract: result["data"][0]
#
# 1K token truncation applied BEFORE calling — see truncate_to_1k()
```

---

## 9. All 8 RAG Techniques

### Base class

```python
# app/techniques/base.py
class BaseRAGTechnique(ABC):
    def __init__(self, supabase, embed_svc, llm_svc, redis, job_id, ws_manager):
        ...

    @abstractmethod
    async def retrieve(self, query, document_id, user_id, top_k, **kwargs) -> list[dict]:
        ...

    @abstractmethod
    async def generate(self, query, chunks) -> str:
        ...

    async def run(self, request: QueryRequest) -> QueryResponse:
        chunks = await self.retrieve(...)
        answer = await self.generate(...)
        return QueryResponse(...)

    async def emit(self, step, status, color, detail, metadata={}):
        """Broadcast step event to frontend via WebSocket"""
        await ws_manager.emit(self.job_id, {
            "step": step, "status": status,
            "color": color, "detail": detail,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata
        })
```

---

### Technique 1 — Hybrid Search

```python
# Algorithm: BM25 keyword + pgvector ANN → Reciprocal Rank Fusion (k=60)
# BM25 index built from chunk texts at ingest time, stored as pickle on Render disk

# Steps emitted:
#  🟣 EMBED      "Embedding query (bge-m3)..."
#  🟢 BM25       "BM25 keyword search → {n} candidates"
#  🟢 VECTOR     "pgvector ANN search → top-{n}"
#  🟣 RRF        "Reciprocal Rank Fusion merging results..."
#  🟢 DONE       "Hybrid search → top-{k} returned"

async def retrieve(self, query, document_id, user_id, top_k, bm25_weight=0.5):
    q_vec = get_embedding(truncate_to_1k(query))
    bm25_results = bm25_service.search(document_id, query, top_n=top_k * 4)
    vector_results = await supabase.vector_search(q_vec, document_id, user_id, top_k * 4)
    fused = reciprocal_rank_fusion(bm25_results, vector_results, k=60)
    return fused[:top_k]
```

---

### Technique 2 — Re-ranking

```python
# Algorithm: pgvector top-20 → cross-encoder/ms-marco-MiniLM-L-6-v2 → top-K
# Cross-encoder runs on Render CPU. ~3-8s for 20 pairs. Model cached after first load.

# Steps emitted:
#  🟣 EMBED      "Embedding query..."
#  🟢 RETRIEVE   "pgvector: fetching top-20 candidates..."
#  🔴 RERANK     "Cross-encoder re-scoring 20 pairs..."
#  🟢 DONE       "Re-ranked → top-{k}"

async def retrieve(self, query, document_id, user_id, top_k):
    q_vec = get_embedding(truncate_to_1k(query))
    candidates = await supabase.vector_search(q_vec, document_id, user_id, top_k * 4)
    pairs = [(query, c["text"]) for c in candidates]
    scores = cross_encoder.predict(pairs)
    reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    return [c for c, _ in reranked[:top_k]]
```

---

### Technique 3 — Query Expansion (HyDE)

```python
# Algorithm:
#  1. Qwen3 generates hypothetical answer → embed it (HyDE)
#  2. Qwen3 generates 3 query variants → embed each
#  3. FAISS search with all 4 vectors, deduplicate, rank

# Steps emitted:
#  🟣 HYDE       "Qwen3 generating hypothetical answer..."
#  🟣 EXPAND     "Generating 3 query variants..."
#  🟢 EMBED      "Embedding 4 expanded queries..."
#  🟢 SEARCH     "pgvector search with all variants..."
#  🟣 MERGE      "Deduplicating {n} results..."
#  🟢 DONE       "Query expansion → top-{k}"
```

---

### Technique 4 — Metadata Filtering

```python
# Algorithm:
#  1. User sets filters (page range, section, source file, custom JSON fields)
#  2. Supabase SQL pre-filters chunk IDs
#  3. pgvector search restricted to those IDs

# Supported filters:
#  page: {gte: 5, lte: 10}
#  section: "Introduction"
#  source: "contract.docx"
#  file_type: "pdf"
#  metadata->>'custom_key': "value"   (JSONB field)

# Steps emitted:
#  🟤 FILTER     "SQL filter: {filters} → {n} qualifying chunks"
#  🟣 EMBED      "Embedding query..."
#  🟢 SEARCH     "pgvector search in filtered subset..."
#  🟢 DONE       "Metadata-filtered → top-{k}"
```

---

### Technique 5 — ColBERT (Multi-vector MaxSim)

```python
# Algorithm:
#  INGEST: each chunk → tokenize → embed each token → store in colbert_tokens table
#  QUERY:  tokenize query → embed each token → MaxSim scoring
#  MaxSim(q,d) = Σ max_j(q_i · d_j) for each query token i

# ⚠️ WARNING shown in UI before selecting:
# "ColBERT embeds every token individually. For a 50-chunk doc,
#  expect 500-5000 extra embedding calls. Ingestion will be slow."

# Steps emitted:
#  🟣 TOKENIZE   "Tokenizing query into {n} tokens..."
#  🟢 EMBED_TOK  "Embedding {n} query tokens (bge-m3)..."
#  🔴 MAXSIM     "MaxSim scoring {n_chunks} × {n_tokens} token vectors..."
#  🟢 DONE       "ColBERT scoring → top-{k}"
```

---

### Technique 6 — Agentic RAG

```python
# Algorithm: Qwen3 agent with 4 tools, max 5 iterations
# Tools:
#  search_docs(query, top_k)        → pgvector search
#  filter_search(filters, query)    → metadata-filtered search
#  get_page(page_num)               → retrieve specific page
#  summarize_chunks(chunk_ids)      → Qwen3 summarizes chunk set

# Uses your existing Qwen3 wrapper (llm_service.py)
# Tool call JSON parsed with your extract_json_block() + repair_json_with_module()

# Steps emitted (one per agent iteration):
#  🟢 AGENT_INIT "Qwen3 agent ready with 4 tools"
#  🟣 PLAN       "Agent: '{thought[:80]}...'"
#  🟤 TOOL       "Tool call: {tool_name}({args})"
#  🟢 OBSERVE    "Tool returned {n} chunks"
#  🟢 FINAL      "Answer generated after {n} tool calls"
```

---

### Technique 7 — Caching & Incremental Ingestion

```python
# SUB-FEATURE A — Redis Query Cache:
#  key = SHA-256(user_id + document_id + query + technique)
#  hit  → return stored QueryResponse instantly
#  miss → run pipeline → store in Redis (TTL: 1hr) + Supabase overflow
#
# SUB-FEATURE B — Incremental Ingestion:
#  On re-upload: hash each chunk text
#  Compare vs stored hashes in Supabase chunks table
#  NEW chunks     → embed + insert to Supabase
#  CHANGED chunks → delete old vectors, re-embed, insert new
#  UNCHANGED      → skip entirely (0 embedding calls)
#  DELETED chunks → remove from Supabase (CASCADE deletes vectors)
#  Saves 80-95% of embedding calls on document updates

# Steps emitted:
#  🟤 CACHE_CHECK "Checking Redis cache..."
#  🟢 CACHE_HIT   "Cache hit — returning stored answer (0ms)" OR
#  🟣 CACHE_MISS  "Cache miss. Running pipeline..."
#  ──── Incremental ────
#  🟤 DIFF        "Comparing {n} new chunks vs {m} stored..."
#  🟢 DELTA       "{new} new, {changed} changed, {same} unchanged"
#  🟣 EMBED_DELTA "Embedding {n} delta chunks only..."
#  🟢 DONE        "Incremental update complete"
```

---

### Technique 8 — RAGAs Evaluation

```python
# User uploads CSV: question,ground_truth
# For each question:
#   1. Retrieve top-K chunks (standard vector search)
#   2. Generate answer via Qwen3
#   3. Collect dataset: (question, answer, contexts, ground_truth)
# RAGAs metrics (Qwen3 as judge):
#   faithfulness, answer_relevancy, context_precision, context_recall
# Results saved to Supabase eval_reports table
# Frontend shows Recharts radar chart + per-question table

# Steps emitted:
#  🟣 SETUP      "RAGAs initialized — {n} test questions"
#  🟢 RETRIEVE   "Retrieving context for Q{i}/{n}..."
#  🟣 GENERATE   "Qwen3 generating answer {i}/{n}..."
#  🔴 SCORE      "Computing RAGAs metrics (Qwen3 as judge)..."
#  🟢 REPORT     "Faithfulness:{f:.2f} Relevancy:{r:.2f} ..."
```

---

## 10. Multi-User Architecture

### User Isolation

```
Supabase row-level security (RLS) policies:
  All tables have user_id column
  RLS enabled: users can only see their own rows
  Enforced at DB level — even if API has a bug, data stays isolated

FAISS → replaced by Supabase pgvector → isolation via user_id column
BM25 index files → ./data/bm25_indexes/{user_id}_{doc_id}.pkl
Upload temp files → ./data/uploads/{user_id}/{filename}
Redis cache keys → cache:{user_id}:{doc_id}:{query_hash}
```

### JWT Auth Flow

```
POST /auth/register  →  username + password → bcrypt hash → Supabase users table
POST /auth/login     →  verify password → return JWT (24h expiry)
All protected routes → Authorization: Bearer {token}
Frontend → JWT stored in Zustand memory (NOT localStorage — XSS safe)
POST /auth/refresh   → return new JWT before expiry
```

### WebSocket Isolation

```python
# app/utils/ws_manager.py
# One WebSocket connection per (user_id, job_id)
# Job ownership verified before connecting
# Users only receive their own pipeline events

class WSManager:
    _connections: dict[str, WebSocket] = {}  # key = f"{user_id}:{job_id}"

    async def connect(self, job_id, websocket, user_id):
        key = f"{user_id}:{job_id}"
        self._connections[key] = websocket

    async def emit(self, job_id, user_id, event: dict):
        key = f"{user_id}:{job_id}"
        ws = self._connections.get(key)
        if ws:
            await ws.send_json(event)
```

---

## 11. API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT |
| POST | `/auth/refresh` | Refresh JWT |

### Ingestion
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ingest/upload` | Upload file → background job |
| GET | `/ingest/status/{job_id}` | Job status + pipeline steps |
| GET | `/ingest/documents` | User's document list |
| DELETE | `/ingest/document/{doc_id}` | Delete doc + vectors |
| POST | `/ingest/reindex/{doc_id}` | Incremental re-ingest |

### Query
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/query/search` | RAG query with technique |
| GET | `/query/history/{doc_id}` | Query history |
| DELETE | `/query/cache/{doc_id}` | Clear Redis cache |

### Evaluate
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/evaluate/run` | Run RAGAs (CSV upload) |
| GET | `/evaluate/report/{doc_id}` | Latest report |

### Stats & Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats/documents` | Docs with chunk counts |
| GET | `/health` | Backend + Supabase + Redis status |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `WS /ws/pipeline/{job_id}?token={jwt}` | Real-time pipeline steps |

---

## 12. Frontend — React Deep Dive

### Tailwind Green + Violet Theme

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {   // Green
          50: '#f0fdf4', 400: '#4ade80',
          500: '#22c55e', 600: '#16a34a', 700: '#15803d'
        },
        accent: {    // Violet
          50: '#f5f3ff', 400: '#a78bfa',
          500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9'
        },
        surface: {   // Dark base for dashboard
          900: '#0a0f0a', 800: '#111a11', 700: '#1a2b1a'
        }
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(34,197,94,0.25)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.25)',
      }
    }
  }
}
```

### Step Color Mapping

```js
// src/utils/stepColors.js
export const STEP_COLORS = {
  // Violet — LLM / AI ops
  EMBED: '#8B5CF6', HYDE: '#8B5CF6', EXPAND: '#7C3AED',
  PLAN: '#8B5CF6', GENERATE: '#7C3AED', SCORE: '#6D28D9',
  CACHE_MISS: '#8B5CF6', EMBED_DELTA: '#8B5CF6',
  SETUP: '#8B5CF6', EMBED_TOK: '#8B5CF6', TOKENIZE: '#7C3AED',
  OCR_START: '#8B5CF6', IMAGE_ANALYZE: '#8B5CF6',

  // Green — retrieval / data ops
  BM25: '#22C55E', VECTOR: '#16A34A', DONE: '#22C55E',
  CACHE_HIT: '#22C55E', RETRIEVE: '#16A34A', OBSERVE: '#22C55E',
  DELTA: '#22C55E', AGENT_INIT: '#22C55E', OCR_DONE: '#22C55E',
  FINAL: '#22C55E', REPORT: '#22C55E',

  // Special
  RERANK: '#EF4444',  // red — heavy compute, distinct
  MAXSIM: '#EF4444',  // red — heavy compute
  FILTER: '#D97706',  // amber — metadata ops
  TOOL:   '#D97706',  // amber — tool calls
  DIFF:   '#6B7280',  // gray — neutral checks
  CACHE_CHECK: '#6B7280',
  RRF:    '#8B5CF6',  // violet — fusion
  ERROR:  '#EF4444',  // red
}
```

### Pipeline Page UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🟢 RAG Pipeline                      [user ▾]  [Logout]    │
├─────────────────────────────────────────────────────────────┤
│  📄 document.pdf   142 chunks   ✅ Indexed                  │
├───────────────────────────┬─────────────────────────────────┤
│  SELECT TECHNIQUE         │  CHUNKING CONFIG                │
│  ┌────────┐  ┌────────┐  │  Chunk  ──────●────── 512 tok  │
│  │Hybrid  │  │ReRank  │  │  Overlap ───●──────── 64 tok   │
│  └────────┘  └────────┘  │  Strategy [Fixed ▾]            │
│  ┌────────┐  ┌────────┐  │  Est. chunks: ~148              │
│  │ HyDE  │  │ Meta   │  │  [Apply & Re-chunk]             │
│  └────────┘  └────────┘  │                                 │
│  ┌────────┐  ┌────────┐  │                                 │
│  │ColBERT │  │Agentic │  │                                 │
│  └────────┘  └────────┘  │                                 │
│  ┌────────┐  ┌────────┐  │                                 │
│  │ Cache  │  │ RAGAs  │  │                                 │
│  └────────┘  └────────┘  │                                 │
├───────────────────────────┴─────────────────────────────────┤
│  QUERY                                                       │
│  ┌──────────────────────────────────────┐  [🔍 Search]     │
│  └──────────────────────────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  PIPELINE TRACE  ● LIVE                                      │
│  🟣 EMBED     Embedding query (bge-m3)...          ✅ 2.1s │
│  🟢 BM25      Keyword search → 22 candidates       ✅ 0.1s │
│  🟢 VECTOR    pgvector ANN → top-20                ✅ 0.3s │
│  🟣 RRF       Reciprocal Rank Fusion...             ⏳      │
├─────────────────────────────────────────────────────────────┤
│  ANSWER                                                      │
│  The contract was signed on April 3rd, 2024...              │
│  SOURCES                                                     │
│  📄 contract.docx §3   Score: 0.94  ██████████ 94%         │
│  📄 contract.docx §1   Score: 0.81  ████████── 81%         │
└─────────────────────────────────────────────────────────────┘
```

### Key React Hooks

```js
// usePipelineWS.js — WebSocket for real-time steps
// Connects to: wss://{backend}/ws/pipeline/{job_id}?token={jwt}
// Each message → add to pipelineStore.steps
// Auto-reconnects (max 3 attempts)
// Shows "LIVE" green dot while connected

// useUpload.js — Upload + job polling
// POST /ingest/upload (multipart form)
// Polls /ingest/status/{job_id} every 2s until done/failed

// useQuery.js — RAG search
// POST /query/search → streams answer via WebSocket
// Updates answerPanel + sourceChunks + pipeline steps simultaneously
```

---

## 13. Docker Setup

### `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps for python-docx, tiktoken
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download cross-encoder model at build time (not runtime)
RUN python -c "from sentence_transformers import CrossEncoder; \
    CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')"

COPY . .

# Create data dirs
RUN mkdir -p data/uploads data/bm25_indexes data/cache

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", \
     "--port", "8000", "--workers", "2"]
```

### `docker-compose.yml` — Local Dev

```yaml
version: "3.9"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - MISTRAL_API_KEY=${MISTRAL_API_KEY}
      # ... other env vars from .env
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/data:/app/data       # BM25 indexes + uploads persist locally
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Optional: local frontend dev server
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
      - VITE_WS_BASE_URL=ws://localhost:8000
    volumes:
      - ./frontend/src:/app/src        # hot reload
    restart: unless-stopped
```

### `backend/requirements.txt`

```txt
fastapi==0.111.0
uvicorn[standard]==0.30.0
gunicorn==22.0.0
pydantic-settings==2.3.0
supabase==2.5.0
asyncpg==0.29.0
redis==5.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.0
gradio_client==0.17.0
tiktoken==0.7.0
python-docx==1.1.2
rank_bm25==0.2.2
sentence-transformers==3.0.1
ragas==0.1.14
json_repair==0.25.2
loguru==0.7.2
slowapi==0.1.9
```

---

## 14. Environment Variables

> All values go into **Render Dashboard → Environment tab**.  
> Never committed to Git. `.env.example` has key names only.

### Render Backend

```env
# Supabase
SUPABASE_URL              = https://xxxx.supabase.co
SUPABASE_KEY              = your_service_role_key
SUPABASE_DB_URL           = postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres

# Embeddings (HF Space — free)
EMBED_API_URL             = https://lamhieu-lightweight-embeddings.hf.space/
EMBED_MODEL               = bge-m3
EMBED_DIM                 = 1024
EMBED_AUTH_KEY            =
EMBED_MAX_TOKENS          = 1000
EMBED_TIMEOUT             = 60
EMBED_MAX_RETRIES         = 3

# LLM — Qwen3 (HF Space — free)
QWEN3_MODEL_NAME          = Qwen/Qwen3-Demo
QWEN3_THINKING_BUDGET     = 38
LLM_RESPONSE_TIMEOUT      = 1080
MAX_LLM_RETRIES           = 5
MAX_TIMEOUT_RETRIES       = 10

# OCR — Mistral (needs API key)
MISTRAL_OCR_SPACE         = tatendachirume/Mistral-OCR
MISTRAL_API_KEY           = your_mistral_api_key

# Image — Ernie Bot (free HF Space)
ERNIE_SPACE_URL           = https://baidu-simple-ernie-bot-demo.hf.space/

# Redis (auto-filled by Render when Redis added)
REDIS_URL                 = redis://...
CACHE_TTL_SECONDS         = 3600

# Auth
JWT_SECRET_KEY            = generate_with: openssl rand -hex 32
JWT_ALGORITHM             = HS256
JWT_EXPIRE_MINUTES        = 1440

# Re-ranking
RERANK_MODEL              = cross-encoder/ms-marco-MiniLM-L-6-v2

# Limits
RATE_LIMIT_PER_MINUTE     = 20
RATE_LIMIT_UPLOAD_PER_DAY = 50
MAX_FILE_SIZE_MB          = 50

# Defaults
DEFAULT_CHUNK_SIZE        = 512
DEFAULT_OVERLAP           = 64
DEFAULT_TOP_K             = 5

# CORS
CORS_ORIGINS              = https://your-app.netlify.app,http://localhost:5173
```

### Netlify Frontend

```env
VITE_API_BASE_URL = https://your-backend.onrender.com
VITE_WS_BASE_URL  = wss://your-backend.onrender.com
```

### Local Dev (`backend/.env`)

```env
# Same as Render vars above +
REDIS_URL = redis://localhost:6379
CORS_ORIGINS = http://localhost:5173
```

---

## 15. Deployment Guide

### Step 1 — Supabase Setup (10 min)

```
1. supabase.com → New project (free)
2. Settings → Database → Copy connection string → SUPABASE_DB_URL
3. Settings → API → Copy URL + service_role key
4. SQL Editor → run the schema SQL from Section 4
5. SQL Editor → run the match_chunks() function SQL from Section 4
6. Authentication → Disable (we handle auth ourselves with JWT)
7. Table Editor → Enable RLS on all tables
```

### Step 2 — Render Backend (15 min)

```
1. render.com → New Web Service → Connect GitHub → select backend/
2. Runtime: Python / Docker (choose Docker — uses our Dockerfile)
3. Build command: (auto from Dockerfile)
4. Start command: (auto from Dockerfile CMD)
5. Add Redis: New → Redis → Free tier → auto-links REDIS_URL
6. Environment tab: add all vars from Section 14
7. Deploy → wait ~5 min
8. Test: curl https://your-app.onrender.com/health
```

### Step 3 — Netlify Frontend (5 min)

```
1. netlify.com → New site → Import from GitHub → select frontend/
2. Build command: npm run build
3. Publish dir: dist
4. Environment vars: VITE_API_BASE_URL, VITE_WS_BASE_URL
5. Deploy
6. Copy Netlify URL → update CORS_ORIGINS in Render env
```

### Step 4 — Local Dev

```bash
# Clone repo
git clone https://github.com/you/rag-pipeline.git
cd rag-pipeline

# Copy env files
cp backend/.env.example backend/.env
# Fill in values

# Start with Docker Compose
docker-compose up --build

# Frontend available: http://localhost:5173
# Backend available:  http://localhost:8000
# Redis:              localhost:6379
```

---

## 16. Production Additions

Items added beyond what you mentioned — all included in this blueprint:

| # | Item | Why |
|---|------|-----|
| 1 | JWT auth + multi-user | You said multi-user needed |
| 2 | Supabase Row Level Security | Data isolation at DB level |
| 3 | Rate limiting (slowapi) | Prevent abuse on free Render tier |
| 4 | Docker + docker-compose | Local dev, portfolio quality, Render deployment |
| 5 | Cross-encoder model pre-downloaded in Dockerfile | Avoid cold download on first query |
| 6 | File cleanup after ingestion | Prevent disk fill on Render |
| 7 | JWT in Zustand memory (not localStorage) | XSS attack prevention |
| 8 | WebSocket user isolation | Multi-user safety |
| 9 | ColBERT warning dialog | Prevent accidental slow ingestion |
| 10 | /health endpoint | Shows Supabase + Redis status to frontend |
| 11 | BM25 pickle persisted on Render disk | Hybrid search needs it across restarts |
| 12 | Render cold start note | Free tier sleeps after 15 min — warn interviewer |

### ⚠️ One Render Free Tier Limitation

Render free tier **sleeps after 15 minutes of inactivity**. First request takes 30-60 seconds to wake up. For an interview demo, either:
- Upgrade to Starter ($7/mo) — keeps it warm
- OR ping `/health` from frontend every 5 min to prevent sleep
- OR just open the app 2 min before the interview

---

> **Next step:** Confirm this blueprint and tell me which module to code first.  
> Recommended order: `backend/` → `local-bridge removed` → `frontend/`  
> Say **"start backend"** and I will generate every file.
