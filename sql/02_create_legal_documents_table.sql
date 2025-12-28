-- Create legal_documents table with vector support
create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  type text not null, -- 'lawyer', 'case', 'article'
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for vector similarity search
create index if not exists legal_documents_embedding_idx on legal_documents 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create index for type filtering
create index if not exists legal_documents_type_idx on legal_documents (type);

