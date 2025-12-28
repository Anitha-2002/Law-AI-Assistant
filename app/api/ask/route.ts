import { NextRequest, NextResponse } from "next/server";
import { appendFileSync } from "fs";
import { supabaseAdmin } from "@/lib/supabase";
// #region agent log
try {
  appendFileSync(
    "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
    JSON.stringify({
      location: "app/api/ask/route.ts:5",
      message: "After supabase import",
      data: { supabaseAdminExists: !!supabaseAdmin },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "F",
    }) + "\n"
  );
} catch (e) {}
// #endregion
import { createEmbedding, createChatCompletion } from "@/lib/openai";
// #region agent log
try {
  appendFileSync(
    "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
    JSON.stringify({
      location: "app/api/ask/route.ts:8",
      message: "After openai import",
      data: {
        openaiExists: !!openai,
        createEmbeddingExists: !!createEmbedding,
      },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "F",
    }) + "\n"
  );
} catch (e) {}
// #endregion

const SYSTEM_PROMPT = `You are a legal AI assistant.
Answer only from the provided context.
If the answer is not in the context, say you do not know.
Be accurate, concise, and cite the sources when relevant.`;

export async function POST(request: NextRequest) {
  // #region agent log
  try {
    appendFileSync(
      "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
      JSON.stringify({
        location: "app/api/ask/route.ts:16",
        message: "API POST entry",
        data: {
          hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasOpenaiKey: !!process.env.OPENAI_API_KEY,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }) + "\n"
    );
  } catch (e) {}
  // #endregion
  try {
    const { question } = await request.json();
    // #region agent log
    try {
      appendFileSync(
        "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
        JSON.stringify({
          location: "app/api/ask/route.ts:21",
          message: "After parsing question",
          data: {
            question: question?.substring(0, 50) || "MISSING",
            questionType: typeof question,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "A",
        }) + "\n"
      );
    } catch (e) {}
    // #endregion

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Step 1: Create embedding for the question
    // #region agent log
    try {
      appendFileSync(
        "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
        JSON.stringify({
          location: "app/api/ask/route.ts:25",
          message: "Before createEmbedding call",
          data: { questionLength: question?.length },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "D",
        }) + "\n"
      );
    } catch (e) {}
    // #endregion
    let queryEmbedding: number[];
    try {
      queryEmbedding = await createEmbedding(question);
      // #region agent log
      try {
        appendFileSync(
          "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
          JSON.stringify({
            location: "app/api/ask/route.ts:29",
            message: "After createEmbedding call",
            data: {
              embeddingLength: queryEmbedding?.length,
              embeddingType: Array.isArray(queryEmbedding) ? "array" : "other",
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }) + "\n"
        );
      } catch (e) {}
      // #endregion
    } catch (embeddingError: any) {
      // #region agent log
      try {
        appendFileSync(
          "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
          JSON.stringify({
            location: "app/api/ask/route.ts:33",
            message: "Embedding creation failed",
            data: {
              errorName: embeddingError?.name,
              errorMessage: embeddingError?.message,
              statusCode: embeddingError?.status,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "C,D",
          }) + "\n"
        );
      } catch (e) {}
      // #endregion
      if (embeddingError?.status === 429) {
        return NextResponse.json(
          {
            error:
              "OpenAI API quota exceeded. Please check your OpenAI account billing and quota limits.",
          },
          { status: 429 }
        );
      }
      if (embeddingError?.status === 401) {
        return NextResponse.json(
          {
            error:
              "OpenAI API authentication failed. Please check your API key.",
          },
          { status: 401 }
        );
      }
      throw embeddingError; // Re-throw to be caught by outer catch
    }

    // Step 2: Call match_legal_documents function
    // #region agent log
    try {
      appendFileSync(
        "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
        JSON.stringify({
          location: "app/api/ask/route.ts:35",
          message: "Before Supabase RPC call",
          data: { supabaseAdminExists: !!supabaseAdmin },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "B",
        }) + "\n"
      );
    } catch (e) {}
    // #endregion
    // First check if database has any documents
    const { count: docCount } = await supabaseAdmin
      .from("legal_documents")
      .select("*", { count: "exact", head: true });

    // #region agent log
    try {
      appendFileSync(
        "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
        JSON.stringify({
          location: "app/api/ask/route.ts:44",
          message: "Database document count check",
          data: {
            documentCount: docCount || 0,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "B",
        }) + "\n"
      );
    } catch (e) {}
    // #endregion

    const { data: matches, error: matchError } = await supabaseAdmin.rpc(
      "match_legal_documents",
      {
        query_embedding: queryEmbedding,
        match_count: 5,
      }
    );
    // #region agent log
    try {
      appendFileSync(
        "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
        JSON.stringify({
          location: "app/api/ask/route.ts:60",
          message: "After Supabase RPC call",
          data: {
            hasMatches: !!matches,
            matchesCount: matches?.length || 0,
            hasError: !!matchError,
            errorMessage: matchError?.message || null,
            firstMatchSimilarity: matches?.[0]?.similarity || null,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "B",
        }) + "\n"
      );
    } catch (e) {}
    // #endregion

    if (matchError) {
      console.error("Error matching documents:", matchError);
      return NextResponse.json(
        { error: "Failed to search legal documents" },
        { status: 500 }
      );
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        answer:
          "I do not have enough information to answer this question based on the available legal documents.",
        sources: [],
      });
    }

    // Step 3: Build context from matched documents
    const context = matches
      .map(
        (match: any) =>
          `[${match.type.toUpperCase()}] ${match.title}\n${match.content}`
      )
      .join("\n\n---\n\n");

    // Step 4: Send to free LLM with context
    // #region agent log
    try {
      appendFileSync(
        "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
        JSON.stringify({
          location: "app/api/ask/route.ts:100",
          message: "Before LLM completion call",
          data: { contextLength: context?.length },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "C",
        }) + "\n"
      );
    } catch (e) {}
    // #endregion
    let completion;
    try {
      completion = await createChatCompletion(
        [
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
          },
        ],
        SYSTEM_PROMPT
      );
      // #region agent log
      try {
        appendFileSync(
          "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
          JSON.stringify({
            location: "app/api/ask/route.ts:113",
            message: "After LLM completion call",
            data: {
              hasCompletion: !!completion,
              hasChoices: !!completion?.choices,
              choicesLength: completion?.choices?.length || 0,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "C",
          }) + "\n"
        );
      } catch (e) {}
      // #endregion
    } catch (completionError: any) {
      // #region agent log
      try {
        appendFileSync(
          "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
          JSON.stringify({
            location: "app/api/ask/route.ts:116",
            message: "LLM completion failed",
            data: {
              errorName: completionError?.name,
              errorMessage: completionError?.message,
              statusCode: completionError?.status,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "C",
          }) + "\n"
        );
      } catch (e) {}
      // #endregion
      return NextResponse.json(
        {
          error:
            completionError?.message ||
            "Failed to generate response. Please try again.",
        },
        { status: 500 }
      );
    }

    const answer = completion.choices[0]?.message?.content || "I do not know.";

    // Step 5: Format sources
    const sources = matches.map((match: any) => ({
      id: match.id,
      title: match.title,
      type: match.type,
      similarity: match.similarity,
    }));

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error) {
    // #region agent log
    try {
      appendFileSync(
        "/Users/anitha/Documents/Anitha Business/Law-AI-Assistant/.cursor/debug.log",
        JSON.stringify({
          location: "app/api/ask/route.ts:90",
          message: "Catch block - error occurred",
          data: {
            errorName: error instanceof Error ? error.name : "unknown",
            errorMessage:
              error instanceof Error ? error.message : String(error),
            errorStack:
              error instanceof Error ? error.stack?.substring(0, 200) : null,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "A,B,C,D,E,F",
        }) + "\n"
      );
    } catch (e) {}
    // #endregion
    console.error("Error in /api/ask:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
