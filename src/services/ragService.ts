import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { clientPromise, getMongoDb } from "@/lib/mongodb";
import fs from "fs";
import path from "path";
import { Document } from "@langchain/core/documents";
import { HistoryItem } from "@/types/chat";

export type CategoryType = "all" | "food" | "workouts" | "form";

// ── Category config ───────────────────────────────────────────────────────────
// Maps each category to: which knowledge-base source files are relevant

const CATEGORY_CONFIG: Record<
  CategoryType,
  { sources: string[]; persona: string }
> = {
  all: {
    sources: ["foods.json", "meal-plan.json", "workout.json", "form-guides.json"],
    persona: `You are Gbebody AI — a friendly, motivating fitness and nutrition coach specialised in Nigerian foods and workout culture.
You cover all topics: workouts, nutrition, meal planning, exercise form, and healthy lifestyle.
Always tie advice back to practical Nigerian context where relevant (local foods, gym culture, NEPA cuts, etc).`,
  },
  food: {
    sources: ["foods.json", "meal-plan.json"],
    persona: `You are Gbebody AI in Nutrition Mode — a diet coach who specialises in Nigerian foods and evidence-based nutrition.
Focus ONLY on: meal plans, macros, calories, Nigerian food nutrition profiles, pre/post-workout nutrition, healthy recipes, and weight-management through diet.
If the user asks something unrelated to food or nutrition, gently redirect them:
"That's outside my nutrition lane — try switching to the Workouts or Form & Technique category for that!"`,
  },
  workouts: {
    sources: ["workout.json"],
    persona: `You are Gbebody AI in Workout Mode — a strength and conditioning coach.
Focus ONLY on: training programmes, workout splits, progressive overload, cardio, exercise selection, sets/reps/intensity, and recovery.
If the user asks something unrelated to workouts or training, gently redirect them:
"That's more of a nutrition or form question — switch categories and I'll have you covered!"`,
  },
  form: {
    sources: ["form-guides.json"],
    persona: `You are Gbebody AI in Form & Technique Mode — a movement specialist and injury-prevention coach.
Focus ONLY on: proper exercise technique, movement cues, common form mistakes, injury prevention, mobility, and warm-up drills.
If the user asks something unrelated to exercise form or technique, gently redirect them:
"That sounds like a workout programming or nutrition question — flip to the right category and let's go! "`,
  },
};


const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});

const primaryLlm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});

const fallbackLlm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});

const llmWithFallback = primaryLlm.withFallbacks([fallbackLlm]);


declare global {
  var _cachedVectorStore: MongoDBAtlasVectorSearch | undefined;
  // Per-category chain cache — keyed by CategoryType
  var _cachedChains: Partial<Record<CategoryType, RunnableSequence>> | undefined;
}
// ── Vector store (shared across categories) ───────────────────────────────────

export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
  if (global._cachedVectorStore) {
    return global._cachedVectorStore;
  }

  const collectionName = process.env.MONGODB_COLLECTION_NAME || "knowledge_chunks";
  const dbName = process.env.MONGODB_DB_NAME || "rag_db";

  const mongoClient = await clientPromise;
  const collection = mongoClient.db(dbName).collection(collectionName) as any;

  global._cachedVectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });

  return global._cachedVectorStore;
}

// ── Category-aware retriever ───────────────────────────────────────────────────
// Filters retrieved chunks to only the source files relevant to the active category.

function getRetriever(category: CategoryType) {
  const { sources } = CATEGORY_CONFIG[category];

  return {
    invoke: async (question: string): Promise<Document[]> => {
      const vectorStore = await getVectorStore();

      if (category === "all") {
        // No filter — retrieve from all sources
        const retriever = vectorStore.asRetriever({ k: 5 });
        return retriever.invoke(question);
      }

      // Pre-filter by metadata.source so retrieval stays on-topic
      const retriever = vectorStore.asRetriever({
        k: 5,
        filter: {
          preFilter: {
            source: { $in: sources },
          },
        },
      });

      return retriever.invoke(question);
    },
  };
}

async function getChain(category: CategoryType): Promise<RunnableSequence> {
  if (!global._cachedChains) global._cachedChains = {};
  if (global._cachedChains[category]) return global._cachedChains[category]!;

  const retriever = getRetriever(category);
  const { persona } = CATEGORY_CONFIG[category];

  const prompt = PromptTemplate.fromTemplate(`
{persona}

Use the knowledge base context below when it is relevant. If the context doesn't fully cover the question, answer from your own expertise — do NOT say you lack information.

--- Knowledge Base Context ---
{context}
--- End Context ---

Chat History:
{chatHistory}

User: {question}
Assistant:`);

  global._cachedChains[category] = RunnableSequence.from([
    {
      context: async (input: {
        question: string;
        chatHistory: string;
        persona: string;
      }) => {
        const docs = await retriever.invoke(input.question);
        return docs.length > 0
          ? docs.map((d: Document) => d.pageContent).join("\n\n")
          : "No specific context found — answer from general fitness knowledge.";
      },
      chatHistory: (input: { question: string; chatHistory: string; persona: string }) =>
        input.chatHistory,
      question: (input: { question: string; chatHistory: string; persona: string }) =>
        input.question,
      persona: (input: { question: string; chatHistory: string; persona: string }) =>
        input.persona,
    },
    prompt,
    llmWithFallback,
    new StringOutputParser(),
  ]);

  return global._cachedChains[category]!;
}

export async function ingestKnowledgeBase() {
  const db = await getMongoDb();
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME!);
  await collection.deleteMany({});

  const files = ["foods.json", "meal-plan.json", "workout.json", "form-guides.json"];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  for (const file of files) {
    const filePath = path.join(process.cwd(), "src", "data", file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    const docs = Object.entries(data).map(([key, value]) => ({
      pageContent: JSON.stringify(value),
      metadata: { source: file, type: key },
    }));

    const chunks = await splitter.splitDocuments(docs as any);
    const vectorStore = await getVectorStore();
    await vectorStore.addDocuments(chunks);
  }

  console.log("Knowledge base ingested into MongoDB Vector Search");
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function streamWithRetry(
  question: string,
  chatHistory: string,
  category: CategoryType,
  attempt = 0
): Promise<ReadableStream> {
  const { persona } = CATEGORY_CONFIG[category];

  if (attempt > 0 && global._cachedChains) {
    delete global._cachedChains[category];
  }

  const chain = await getChain(category);
  const langchainStream = await chain.stream({ question, chatHistory, persona });
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of langchainStream) {
          if (chunk) {
            controller.enqueue(encoder.encode(typeof chunk === "string" ? chunk : String(chunk)));
          }
        }
        controller.close();
      } catch (error: any) {
        const isRetryable =
          error?.status === 503 ||
          error?.status === 429 ||
          error?.message?.includes("503") ||
          error?.message?.includes("Failed to parse stream") ||
          error?.message?.includes("fetch failed") ||
          error?.message?.includes("high demand");

        if (isRetryable && attempt < MAX_RETRIES) {
          console.warn(`Gemini stream error (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));

          try {
            // Get a fresh stream from the retry attempt
            const retryStream = await streamWithRetry(question, chatHistory, category, attempt + 1);
            const reader = retryStream.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value); // controller is still open here
            }
            controller.close();
          } catch (retryError) {
            controller.error(retryError);
          }
        } else {
          console.error("Gemini stream failed after retries:", error);
          controller.error(error);
        }
      }
    },
  });
}

export async function askRAG(
  question: string,
  history: HistoryItem[] = [],
  category: CategoryType = "all"
): Promise<ReadableStream> {
  const chatHistory = history.map((h) => `${h.role}: ${h.content}`).join("\n");
  return streamWithRetry(question, chatHistory, category);
}