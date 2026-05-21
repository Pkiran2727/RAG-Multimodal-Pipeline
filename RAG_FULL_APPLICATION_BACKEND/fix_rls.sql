-- Disable RLS for local testing demo
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunk_vectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE colbert_tokens DISABLE ROW LEVEL SECURITY;

-- Ensure the 'admin' user is seeded if we can
-- (The backend seed_admin will do this once RLS is off)
