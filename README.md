# Legal AI Assistant

A full-stack Legal AI Assistant built with Next.js, Supabase (pgvector), and OpenAI that answers questions about lawyers and legal cases using Retrieval-Augmented Generation (RAG).

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) with React and TypeScript
- **Database**: Supabase PostgreSQL with pgvector extension
- **AI**: OpenAI GPT-4 for chat completions and text-embedding-3-small for embeddings
- **State Management**: Redux Toolkit with RTK Query
- **Styling**: Tailwind CSS with custom color system

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account ([supabase.com](https://supabase.com))
- An OpenAI API key ([platform.openai.com](https://platform.openai.com))

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and API keys from Settings → API
3. Go to SQL Editor in Supabase dashboard
4. Run the SQL files in order:
   - `sql/01_enable_vector_extension.sql`
   - `sql/02_create_legal_documents_table.sql`
   - `sql/03_create_match_function.sql`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Ingest Sample Data

Run the ingest script to populate the database with sample data:

```bash
npm run ingest
```

This will:
- Create embeddings for 5 lawyers, 5 cases, and 5 legal articles
- Store them in your Supabase database

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   └── ask/
│   │       └── route.ts          # RAG API endpoint
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main UI page
├── lib/
│   ├── api/
│   │   └── legalApi.ts            # RTK Query API
│   ├── openai.ts                  # OpenAI client
│   ├── providers.tsx              # Redux provider
│   ├── store.ts                   # Redux store
│   └── supabase.ts                # Supabase clients
├── scripts/
│   └── ingest.ts                  # Data ingestion script
├── sql/
│   ├── 01_enable_vector_extension.sql
│   ├── 02_create_legal_documents_table.sql
│   └── 03_create_match_function.sql
└── tailwind.config.ts             # Tailwind configuration
```

## 🧠 How RAG Works

1. **User asks a question** → Frontend sends to `/api/ask`
2. **Create embedding** → Question is converted to a 1536-dimensional vector
3. **Vector search** → Supabase finds the 5 most similar documents using cosine similarity
4. **Context building** → Matched documents are formatted as context
5. **GPT completion** → OpenAI GPT-4 generates an answer based on the context
6. **Response** → Answer and source documents are returned to the user

## 🗄️ Vector Database Manual Setup

The vector database is **Supabase PostgreSQL + pgvector**. Here's how it works:

### What is a Vector DB?

A vector database stores **embeddings** (arrays of numbers) that represent the semantic meaning of text. When you search, it finds the closest vectors using similarity metrics.

### Manual Setup Steps

1. **Enable pgvector extension** (run `sql/01_enable_vector_extension.sql`)
2. **Create table with vector column** (run `sql/02_create_legal_documents_table.sql`)
3. **Insert data with embeddings** (run `scripts/ingest.ts`)
4. **Create similarity search function** (run `sql/03_create_match_function.sql`)

### How Embeddings Work

```typescript
// Text → Embedding
const embedding = await createEmbedding("John Doe is a lawyer")
// Returns: [0.012, -0.98, 0.332, ... 1536 numbers]

// Store in database
await supabase.from('legal_documents').insert({
  title: "John Doe",
  content: "John Doe is a lawyer",
  embedding: embedding
})

// Search by similarity
const matches = await supabase.rpc('match_legal_documents', {
  query_embedding: newQuestionEmbedding,
  match_count: 5
})
```

## 🎨 Customization

### Colors

All colors are defined in `tailwind.config.ts`. Use semantic names:
- `bg-primary-blue` - Primary blue background
- `font-red` - Error text color
- `bg-bg-secondary` - Secondary background

### Adding More Data

Edit `scripts/ingest.ts` to add more lawyers, cases, or articles. Then run:

```bash
npm run ingest
```

## 🔒 Security Notes

- Never commit `.env.local` to version control
- The service role key should only be used server-side
- Consider rate limiting for production use

## 📝 License

MIT

