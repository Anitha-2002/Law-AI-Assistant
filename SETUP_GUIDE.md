# Vector Database Setup Guide

This guide explains how to manually set up the vector database for the Legal AI Assistant.

## 🧠 Understanding Vector Databases

A **vector database** is a database that stores and searches **embeddings** (arrays of numbers) efficiently. In this project, we use:

- **Supabase PostgreSQL** as the database
- **pgvector extension** to enable vector operations
- **OpenAI embeddings** to convert text into vectors

### How It Works

1. **Text → Embedding**: Convert text into a 1536-dimensional vector
2. **Store**: Save the vector in the database alongside the text
3. **Search**: Find similar vectors using cosine similarity
4. **Retrieve**: Get the most relevant documents based on semantic meaning

## 📋 Step-by-Step Manual Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Legal AI Assistant (or your choice)
   - **Database Password**: Save this securely
   - **Region**: Choose closest to you
5. Wait for project creation (2-3 minutes)

### Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 3: Enable pgvector Extension

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `sql/01_enable_vector_extension.sql`:

```sql
create extension if not exists vector;
```

4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see: "Success. No rows returned"

### Step 4: Create the Legal Documents Table

1. In **SQL Editor**, create a new query
2. Copy and paste the contents of `sql/02_create_legal_documents_table.sql`:

```sql
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
```

3. Click **Run**
4. Verify: Go to **Table Editor** → You should see `legal_documents` table

### Step 5: Create the Vector Search Function

1. In **SQL Editor**, create a new query
2. Copy and paste the contents of `sql/03_create_match_function.sql`:

```sql
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
```

3. Click **Run**
4. Verify: Go to **Database** → **Functions** → You should see `match_legal_documents`

### Step 6: Configure Environment Variables

1. Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 7: Install Dependencies

```bash
npm install
```

### Step 8: Ingest Sample Data

Run the ingest script to populate your database:

```bash
npm run ingest
```

This script will:
1. Read sample data (5 lawyers, 5 cases, 5 articles)
2. Call OpenAI API to create embeddings for each document
3. Insert documents with embeddings into Supabase

**What happens during ingestion:**

```typescript
// For each document:
const embedding = await createEmbedding(`${title}\n\n${content}`)
// Returns: [0.012, -0.98, 0.332, ... 1536 numbers]

await supabase.from('legal_documents').insert({
  title: "Sarah Chen",
  content: "Sarah Chen is a California-based lawyer...",
  type: "lawyer",
  embedding: embedding  // The 1536-dimensional vector
})
```

### Step 9: Verify Data

1. Go to **Table Editor** → `legal_documents`
2. You should see 15 rows (5 lawyers + 5 cases + 5 articles)
3. The `embedding` column should show `[1536 dimensions]`

## 🔍 How Vector Search Works

When a user asks a question:

### 1. Question → Embedding

```typescript
const question = "Which lawyers handle environmental cases?"
const queryEmbedding = await createEmbedding(question)
// Returns: [0.045, -0.12, 0.89, ... 1536 numbers]
```

### 2. Vector Similarity Search

```typescript
const { data } = await supabase.rpc('match_legal_documents', {
  query_embedding: queryEmbedding,
  match_count: 5
})
```

**What the SQL function does:**

```sql
-- Calculate cosine distance (<=> operator)
-- Lower distance = more similar
-- Convert to similarity score (1 - distance)
SELECT 
  id, title, content, type,
  1 - (embedding <=> query_embedding) as similarity
FROM legal_documents
ORDER BY embedding <=> query_embedding  -- Closest first
LIMIT 5
```

### 3. Results

The function returns documents sorted by similarity:

```json
[
  {
    "id": "uuid-1",
    "title": "Sarah Chen",
    "content": "Sarah Chen is a California-based lawyer...",
    "type": "lawyer",
    "similarity": 0.87  // 87% similar
  },
  {
    "id": "uuid-2",
    "title": "State v. Environmental Corp",
    "content": "In this landmark environmental case...",
    "type": "case",
    "similarity": 0.82  // 82% similar
  },
  // ... 3 more results
]
```

## 🛠️ Manual Data Insertion (Alternative)

If you want to insert data manually instead of using the script:

### 1. Create Embedding via OpenAI

```typescript
import OpenAI from 'openai'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'Your document text here'
})

const embedding = response.data[0].embedding
```

### 2. Insert via Supabase Dashboard

1. Go to **Table Editor** → `legal_documents`
2. Click **Insert** → **Insert row**
3. Fill in:
   - `title`: Your document title
   - `content`: Your document content
   - `type`: `lawyer`, `case`, or `article`
   - `embedding`: Paste the embedding array (1536 numbers)

### 3. Or Insert via SQL

```sql
INSERT INTO legal_documents (title, content, type, embedding)
VALUES (
  'John Doe',
  'John Doe is a lawyer specializing in...',
  'lawyer',
  '[0.012, -0.98, 0.332, ...]'::vector
);
```

## 🧪 Testing the Vector Search

Test the search function directly in Supabase:

1. Go to **SQL Editor**
2. Create a test embedding (or use a real one from OpenAI):

```sql
-- Test query
SELECT * FROM match_legal_documents(
  '[0.012, -0.98, 0.332, ...]'::vector(1536),  -- Your query embedding
  5  -- Number of results
);
```

## 📊 Understanding Similarity Scores

- **1.0** = Perfect match (identical meaning)
- **0.8-0.9** = Very similar (highly relevant)
- **0.6-0.7** = Somewhat similar (moderately relevant)
- **< 0.5** = Not very similar (low relevance)

The RAG system uses the top 5 most similar documents as context for GPT.

## 🔧 Troubleshooting

### "Extension vector does not exist"
- Make sure you ran `sql/01_enable_vector_extension.sql` first

### "Function match_legal_documents does not exist"
- Verify you ran `sql/03_create_match_function.sql`
- Check **Database** → **Functions** in Supabase dashboard

### "No results returned"
- Make sure you ran the ingest script (`npm run ingest`)
- Check that embeddings are not null in the database
- Verify your query embedding is the correct format (1536 dimensions)

### "Embedding dimension mismatch"
- OpenAI `text-embedding-3-small` returns 1536 dimensions
- Make sure your table uses `vector(1536)`

## 🎯 Next Steps

Once your vector database is set up:

1. ✅ Run `npm run dev` to start the app
2. ✅ Ask questions in the UI
3. ✅ The system will automatically:
   - Convert your question to an embedding
   - Search for similar documents
   - Generate an answer using GPT-4

## 📚 Additional Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase Vector Search](https://supabase.com/docs/guides/ai/vector-columns)

