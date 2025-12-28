// Using free alternatives: Hugging Face for embeddings, Groq for completions
// Groq is OpenAI-compatible and has a generous free tier

// Fallback hash-based embedding generator (simple but works)
function generateHashEmbedding(text: string, dimensions: number): number[] {
  // Simple hash-based embedding for fallback
  const hash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  const embedding: number[] = [];
  for (let i = 0; i < dimensions; i++) {
    const seed = hash(text + i.toString());
    // Normalize to -1 to 1 range
    embedding.push((seed % 2000) / 1000 - 1);
  }
  return embedding;
}

// For embeddings: Try multiple free services
// Note: Database expects 1536 dimensions. We'll use a model that's close and pad if needed.
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    // Try Together AI first (free tier, returns 1024 or 1536 dims depending on model)
    const togetherApiKey = process.env.TOGETHER_API_KEY || "";

    if (togetherApiKey) {
      try {
        console.log("Trying Together AI for embeddings...");
        const response = await fetch("https://api.together.xyz/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${togetherApiKey}`,
          },
          body: JSON.stringify({
            model: "togethercomputer/m2-bert-80M-8k-retrieval", // Free model, 768 dims
            input: text,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const embedding = data.data[0].embedding as number[];
          console.log(
            `✓ Together AI embedding successful (${embedding.length} dims)`
          );
          // Pad to 1536 if needed
          if (embedding.length < 1536) {
            const padding = new Array(1536 - embedding.length).fill(0);
            return [...embedding, ...padding];
          }
          return embedding.slice(0, 1536);
        } else {
          console.log(`Together AI failed: ${response.status}`);
        }
      } catch (e) {
        console.log("Together AI error:", (e as Error).message);
      }
    }

    // Try Cohere free tier (if API key provided)
    const cohereApiKey = process.env.COHERE_API_KEY || "";
    if (cohereApiKey) {
      try {
        console.log("Trying Cohere for embeddings...");
        const response = await fetch("https://api.cohere.ai/v1/embed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cohereApiKey}`,
          },
          body: JSON.stringify({
            model: "embed-english-v3.0",
            texts: [text],
            input_type: "search_document",
            embedding_types: ["float"],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const embedding = data.embeddings[0] as number[];
          console.log(
            `✓ Cohere embedding successful (${embedding.length} dims)`
          );
          // Cohere returns 1024 dims, pad to 1536
          if (embedding.length < 1536) {
            const padding = new Array(1536 - embedding.length).fill(0);
            return [...embedding, ...padding];
          }
          return embedding.slice(0, 1536);
        } else {
          console.log(`Cohere failed: ${response.status}`);
        }
      } catch (e) {
        console.log("Cohere error:", (e as Error).message);
      }
    }

    // Fallback to Hugging Face (free, no key required)
    // Try multiple models/endpoints as some may be unavailable
    const hfEndpoints = [
      "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
      "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2",
      "https://api-inference.huggingface.co/models/sentence-transformers/paraphrase-MiniLM-L6-v2",
      "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    ];

    let result: number[] | null = null;
    let lastError: Error | null = null;

    console.log("Trying Hugging Face for embeddings...");
    for (const hfEndpoint of hfEndpoints) {
      try {
        const response = await fetch(hfEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text }),
        });

        if (response.ok) {
          const embedding = await response.json();

          // Handle response format: can be array of arrays or single array
          if (Array.isArray(embedding)) {
            if (Array.isArray(embedding[0])) {
              result = embedding[0] as number[];
            } else {
              result = embedding as number[];
            }
          } else if (embedding.embeddings) {
            result = embedding.embeddings[0] as number[];
          } else {
            result = embedding as number[];
          }

          if (result && result.length > 0) {
            console.log(
              `✓ Hugging Face embedding successful from: ${hfEndpoint
                .split("/")
                .pop()}`
            );
            break; // Success, exit loop
          }
        } else if (response.status === 503) {
          // Model is loading, wait longer and retry
          console.log(
            `Hugging Face model loading (${hfEndpoint
              .split("/")
              .pop()}), waiting 10 seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, 10000));
          const retryResponse = await fetch(hfEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: text }),
          });
          if (retryResponse.ok) {
            const embedding = await retryResponse.json();
            if (Array.isArray(embedding)) {
              result = Array.isArray(embedding[0])
                ? (embedding[0] as number[])
                : (embedding as number[]);
            } else {
              result = embedding as number[];
            }
            if (result && result.length > 0) {
              console.log(
                `✓ Hugging Face embedding successful after retry: ${hfEndpoint
                  .split("/")
                  .pop()}`
              );
              break; // Success, exit loop
            }
          } else {
            console.log(
              `Hugging Face endpoint failed after retry: ${hfEndpoint
                .split("/")
                .pop()} (${retryResponse.status})`
            );
            lastError = new Error(
              `Hugging Face API error after retry: ${retryResponse.status}`
            );
          }
        } else {
          console.log(
            `Hugging Face endpoint unavailable: ${hfEndpoint
              .split("/")
              .pop()} (${response.status})`
          );
          lastError = new Error(
            `Hugging Face API error: ${response.status} ${response.statusText}`
          );
        }
      } catch (e) {
        console.log(
          `Hugging Face endpoint error: ${hfEndpoint.split("/").pop()}`,
          (e as Error).message
        );
        lastError = e as Error;
        continue; // Try next endpoint
      }
    }

    if (!result) {
      // Last resort: Generate a simple hash-based embedding (not ideal but works)
      console.warn(
        "All embedding APIs failed, using fallback hash-based embedding. Semantic search quality will be poor."
      );
      console.warn("Error:", lastError?.message);
      console.warn(
        "⚠️ WARNING: Hash-based embeddings will NOT work for semantic search. Please get a free API key or fix Hugging Face connection."
      );
      result = generateHashEmbedding(text, 1536);
    } else {
      console.log(
        `✓ Successfully created embedding using Hugging Face (${result.length} dimensions)`
      );
    }

    // Pad to 1536 dimensions (required by database)
    if (result.length < 1536) {
      const repeatCount = Math.ceil(1536 / result.length);
      const repeated = Array(repeatCount).fill(result).flat();
      return repeated.slice(0, 1536);
    }

    return result.slice(0, 1536);
  } catch (error) {
    console.error("Embedding creation error:", error);
    throw error;
  }
}

// For completions: Groq (free tier, OpenAI-compatible API)
import Groq from "groq-sdk";

const groqApiKey = process.env.GROQ_API_KEY || ""; // Optional - Groq has free tier without key for some models

if (groqApiKey) {
  console.log("✓ Groq API key found, will use Groq for chat completions");
} else {
  console.warn(
    "⚠️  No GROQ_API_KEY found, will use Hugging Face for chat completions"
  );
}

export const openai = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// Fallback to Hugging Face chat if Groq not available
export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
) {
  // Try Groq first if available
  if (openai) {
    try {
      console.log("🚀 Using Groq API for chat completion...");
      const completion = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant", // Free, fast model
        messages: [
          { role: "system" as const, content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      console.log("✓ Groq completion successful");
      return completion;
    } catch (error: any) {
      console.error("❌ Groq API error:", error?.message || error);
      console.log("Falling back to Hugging Face...");
    }
  } else {
    console.log(
      "⚠️  Groq not available, using Hugging Face for chat completion"
    );
  }

  // Fallback to Hugging Face Inference API (free, no key required)
  try {
    const userMessage = messages.find((m) => m.role === "user")?.content || "";
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `<|system|>\n${systemPrompt}<|end|>\n<|user|>\n${userMessage}<|end|>\n<|assistant|>\n`,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();

    // Format response to match OpenAI format
    return {
      choices: [
        {
          message: {
            content: Array.isArray(result)
              ? result[0]?.generated_text || "I do not know."
              : result.generated_text || "I do not know.",
          },
        },
      ],
    };
  } catch (error) {
    console.error("All LLM APIs failed:", error);
    throw new Error("Failed to generate response from available LLM services");
  }
}
