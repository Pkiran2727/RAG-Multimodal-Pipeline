---
title: RAG Backend
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# RAG Multimodal Pipeline Backend
This is the backend API for the JEE/NEET RAG pipeline, hosted on Hugging Face Spaces.

## Configuration
All environment variables are managed via Hugging Face Secrets.

## Tech Stack
- FastAPI
- Uvicorn
- Docker
- Sentence Transformers
- Redis (External via Upstash)
- Supabase (External)
