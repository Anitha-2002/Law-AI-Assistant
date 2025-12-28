# Quick Start Guide

Get your Legal AI Assistant running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account ([sign up free](https://supabase.com))
- OpenAI API key ([get one here](https://platform.openai.com))

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run these files in order:
   - `sql/01_enable_vector_extension.sql`
   - `sql/02_create_legal_documents_table.sql`
   - `sql/03_create_match_function.sql`

### 3. Get Your Keys

**From Supabase (Settings → API):**
- Project URL
- anon/public key
- service_role key

**From OpenAI:**
- API key

### 4. Create `.env.local`

Create a file named `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
```

### 5. Ingest Sample Data

```bash
npm run ingest
```

This populates your database with 15 sample documents (5 lawyers, 5 cases, 5 articles).

### 6. Verify Setup (Optional)

```bash
npm run verify
```

### 7. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start asking legal questions!

## Example Questions

- "Which lawyers handle environmental cases?"
- "Tell me about patent infringement cases"
- "What are the recent changes to criminal law?"
- "Who specializes in family law in Miami?"

## Need Help?

- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed vector DB setup
- See [README.md](./README.md) for full documentation

