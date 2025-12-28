-- Create function for vector similarity search
create or replace function match_legal_documents(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  content text,
  type text,
  similarity float
)
language sql
as $$
  select
    id,
    title,
    content,
    type,
    1 - (embedding <=> query_embedding) as similarity
  from legal_documents
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

