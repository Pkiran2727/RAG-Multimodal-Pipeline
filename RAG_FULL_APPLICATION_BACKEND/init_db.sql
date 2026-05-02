-- 1. Enable Extension
create extension if not exists vector;

-- 2. Users Table
create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    username text unique not null,
    password_hash text not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Documents Table (Owner metadata)
create table if not exists documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    filename text not null,
    file_type text not null,
    chunk_strategy text default 'fixed',
    chunk_size int default 512,
    overlap int default 64,
    chunk_count int default 0,
    technique text default 'hybrid',
    status text default 'pending', -- pending, running, done, failed
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Chunks Table (Text + Metadata)
create table if not exists chunks (
    id uuid primary key default gen_random_uuid(),
    document_id uuid references documents(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    text text not null,
    token_count int,
    page int,
    section text,
    chunk_index int,
    parent_chunk_id uuid, -- For parent-child technique
    text_hash text,       -- For incremental ingestion
    metadata jsonb,       -- For generic filtering
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Vectors Table
create table if not exists chunk_vectors (
    id uuid primary key default gen_random_uuid(),
    chunk_id uuid references chunks(id) on delete cascade,
    document_id uuid references documents(id) on delete cascade,
    user_id uuid references users(id) on delete cascade,
    embedding vector(1024), -- bge-m3 dimension
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. ColBERT Token Vectors Table
create table if not exists colbert_tokens (
    id uuid primary key default gen_random_uuid(),
    chunk_id uuid references chunks(id) on delete cascade,
    document_id uuid references documents(id) on delete cascade,
    token_text text,
    token_index int,
    embedding vector(1024),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Hybrid Search / Vector Similarity Function
create or replace function match_chunks (
  query_embedding vector(1024),
  match_document_id uuid,
  match_user_id uuid,
  match_count int,
  filter_chunk_ids uuid[] default null
)
returns table (
  id uuid,
  text text,
  source text,
  page int,
  section text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.text,
    d.filename as source,
    c.page,
    c.section,
    c.metadata,
    1 - (cv.embedding <=> query_embedding) as similarity
  from chunk_vectors cv
  join chunks c on cv.chunk_id = c.id
  join documents d on c.document_id = d.id
  where c.document_id = match_document_id
    and c.user_id = match_user_id
    and (filter_chunk_ids is null or c.id = any(filter_chunk_ids))
  order by cv.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 8. Indexes for Metadata Filtering
create index if not exists idx_chunks_metadata on chunks using gin (metadata);
create index if not exists idx_chunks_user_doc on chunks (user_id, document_id);
create index if not exists idx_vectors_doc on chunk_vectors (document_id);
