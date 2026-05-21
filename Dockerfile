# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY RAG_FULL_APPLICATION_FRONTEND/package*.json ./
RUN npm install
COPY RAG_FULL_APPLICATION_FRONTEND/ ./
RUN npm run build

# Stage 2: Build backend & final monolithic image
FROM python:3.12-slim
WORKDIR /app

# System dependencies for python-docx, tiktoken, Tesseract OCR, etc.
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev tesseract-ocr libmagic1 libgl1 && \
    rm -rf /var/lib/apt/lists/*

COPY RAG_FULL_APPLICATION_BACKEND/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Download cross-encoder model at build time to avoid slow cold start
RUN python -c "from sentence_transformers import CrossEncoder; \
    CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')"

# Copy backend files
COPY RAG_FULL_APPLICATION_BACKEND/ ./

# Copy built frontend assets to the static directory
COPY --from=frontend-builder /frontend/dist ./static

# Create data directories
RUN mkdir -p data/uploads data/bm25_indexes data/cache

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "2"]
