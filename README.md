---
title: RAG Monolith
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# RAG Multimodal Pipeline

This repository hosts a monolithic full-stack deployment of the RAG Multimodal Pipeline on Hugging Face Spaces.

## Setup & Secrets

Make sure to configure the following Secrets in your Space settings:
1. `SUPABASE_URL`
2. `SUPABASE_KEY`
3. `SUPABASE_DB_URL`
4. `REDIS_URL`
5. `JWT_SECRET_KEY`
6. `CORS_ORIGINS` (value can be `*` or the final Space URL)
