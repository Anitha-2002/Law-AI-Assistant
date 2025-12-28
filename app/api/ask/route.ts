import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { openai, createEmbedding } from '@/lib/openai'

const SYSTEM_PROMPT = `You are a legal AI assistant.
Answer only from the provided context.
If the answer is not in the context, say you do not know.
Be accurate, concise, and cite the sources when relevant.`

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Step 1: Create embedding for the question
    const queryEmbedding = await createEmbedding(question)

    // Step 2: Call match_legal_documents function
    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      'match_legal_documents',
      {
        query_embedding: queryEmbedding,
        match_count: 5,
      }
    )

    if (matchError) {
      console.error('Error matching documents:', matchError)
      return NextResponse.json(
        { error: 'Failed to search legal documents' },
        { status: 500 }
      )
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        answer: 'I do not have enough information to answer this question based on the available legal documents.',
        sources: [],
      })
    }

    // Step 3: Build context from matched documents
    const context = matches
      .map(
        (match: any) =>
          `[${match.type.toUpperCase()}] ${match.title}\n${match.content}`
      )
      .join('\n\n---\n\n')

    // Step 4: Send to OpenAI GPT with context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const answer = completion.choices[0]?.message?.content || 'I do not know.'

    // Step 5: Format sources
    const sources = matches.map((match: any) => ({
      id: match.id,
      title: match.title,
      type: match.type,
      similarity: match.similarity,
    }))

    return NextResponse.json({
      answer,
      sources,
    })
  } catch (error) {
    console.error('Error in /api/ask:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

