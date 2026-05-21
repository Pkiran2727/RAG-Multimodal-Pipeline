FROM python:3.12-slim

WORKDIR /app

# System deps for python-docx, tiktoken, etc.
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev tesseract-ocr libmagic1 libgl1 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download cross-encoder model at build time
RUN python -c "from sentence_transformers import CrossEncoder; \
    CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')"

COPY . .

# Create data dirs
RUN mkdir -p data/uploads data/bm25_indexes data/cache

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "2"]
