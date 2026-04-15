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
  maxRetries: 0,
  maxOutputTokens: 1024
});

const fallbackLlm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.5,
  maxRetries: 0,
});

declare global {
  var _cachedVectorStore: MongoDBAtlasVectorSearch | undefined;
  var _cachedChains: Record<string, RunnableSequence> | undefined;
  var _vectorStorePromise: Promise<MongoDBAtlasVectorSearch> | undefined;
}

export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
  if (global._cachedVectorStore) return global._cachedVectorStore;

  if (!global._vectorStorePromise) {
    global._vectorStorePromise = (async () => {
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
    })();
  }

  return global._vectorStorePromise;
}

function getRetriever(category: CategoryType) {
  const { sources } = CATEGORY_CONFIG[category];
  const k = category === "all" ? 5 : 3;

  return {
    invoke: async (question: string): Promise<Document[]> => {
      const vectorStore = await getVectorStore();

      if (category === "all") {
        return vectorStore.asRetriever({ k }).invoke(question);
      }

      return vectorStore
        .asRetriever({
          k,
          filter: { preFilter: { source: { $in: sources } } },
        })
        .invoke(question);
    },
  };
}

const PROMPT = PromptTemplate.fromTemplate(`
{persona}

Use the knowledge base context below when it is relevant. If the context doesn't fully cover the question, answer from your own expertise — do NOT say you lack information.

--- Knowledge Base Context ---
{context}
--- End Context ---

Chat History:
{chatHistory}

User: {question}
Assistant:`);

type LlmMode = "primary" | "fallback";

async function getChain(category: CategoryType, llmMode: LlmMode): Promise<RunnableSequence> {
  if (!global._cachedChains) global._cachedChains = {};

  const cacheKey = `${category}:${llmMode}`;
  if (global._cachedChains[cacheKey]) return global._cachedChains[cacheKey]!;

  const retriever = getRetriever(category);
  const model = llmMode === "fallback" ? fallbackLlm : primaryLlm;

  global._cachedChains[cacheKey] = RunnableSequence.from([
    {
      context: async (input: { question: string; chatHistory: string; persona: string }) => {
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
    PROMPT,
    model,
    new StringOutputParser(),
  ]);

  return global._cachedChains[cacheKey]!;
}

(async () => {
  try {
    await getVectorStore();
    const CATEGORIES: CategoryType[] = ["all", "food", "workouts", "form"];
    await Promise.all(CATEGORIES.map((cat) => getChain(cat, "primary")));
  } catch {
  }
})();

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

function getRetryDelayMs(error: any): number | undefined {
  const retryInfo = error?.errorDetails?.find(
    (detail: any) => detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
  );

  const retryDelay = retryInfo?.retryDelay;
  if (typeof retryDelay === "string") {
    const retryMatch = retryDelay.match(/([\d.]+)s/i);
    if (retryMatch) return Math.ceil(Number(retryMatch[1]) * 1000);
  }

  if (typeof error?.message === "string") {
    const messageMatch = error.message.match(/Please retry in\s+([\d.]+)s/i);
    if (messageMatch) return Math.ceil(Number(messageMatch[1]) * 1000);
  }

  return undefined;
}

function getFriendlyFallbackMessage(error: any): string {
  const retryDelayMs = getRetryDelayMs(error);

  if (isQuotaError(error)) {
    const waitHint =
      typeof retryDelayMs === "number"
        ? ` Please wait about ${Math.max(1, Math.ceil(retryDelayMs / 1000))} seconds and try again.`
        : " Please try again in a little while.";
    return `I'm currently hitting AI provider quota limits.${waitHint}`;
  }

  return "I ran into a temporary AI service issue while generating this reply. Please try again shortly.";
}


function isQuotaError(error: unknown): boolean {
  const err = error as any;
  return (
    err?.status === 429 ||
    String(err?.message || "").includes("429") ||
    String(err?.message || "").toLowerCase().includes("quota")
  );
}

function isTransientError(error: unknown): boolean {
  const err = error as any;
  const msg = String(err?.message || "").toLowerCase();
  const name = String(err?.name || "").toLowerCase();

  if (isQuotaError(error)) return false;

  const statusInMessage = msg.match(/\[(\d{3})\s/)?.[1];
  const status = err?.status ?? (statusInMessage ? parseInt(statusInMessage) : undefined);
  if (status && status >= 400 && status < 500) return false;

  return (
    (status !== undefined && status >= 500) ||
    name.includes("timeout") ||
    msg.includes("fetch failed") ||
    msg.includes("socket") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("premature close")
  );
}

async function streamWithRetry(
  question: string,
  chatHistory: string,
  category: CategoryType,
  llmMode: "primary" | "fallback" = "primary",
  attempt: number = 0
): Promise<ReadableStream> {
  const { persona } = CATEGORY_CONFIG[category];
  const encoder = new TextEncoder();

  console.log(`\n--- STARTING REQUEST (Attempt ${attempt}, Mode: ${llmMode}) ---`);

  console.time("1. Setup & Get Chains");
  const chain = await getChain(category, llmMode);
  console.timeEnd("1. Setup & Get Chains");

  return new ReadableStream({
    async start(controller) {
      try {
        console.time("2. Time to First Token (Retrieval + LLM)");
        console.log("-> Sending request to LangChain...");

        const langchainStream = await chain.stream({ question, chatHistory, persona });

        let firstToken = false;
        for await (const chunk of langchainStream) {
          if (!firstToken) {
            console.timeEnd("2. Time to First Token (Retrieval + LLM)");
            console.log("-> Streaming started!");
            firstToken = true;
          }
          if (chunk) {
            controller.enqueue(
              encoder.encode(typeof chunk === "string" ? chunk : String(chunk))
            );
          }
        }
        controller.close();
        console.log("--- REQUEST COMPLETE ---\n");

      } catch (error: any) {
        console.timeEnd("2. Time to First Token (Retrieval + LLM)");
        console.error("!!! ERROR CAUGHT IN STREAM !!!");
        console.error("Error Message:", error.message);

        const isQuota = isQuotaError(error);
        const isTransient = isTransientError(error);

        if (isQuota && llmMode === "primary") {
          console.warn("-> Primary quota hit. Switching to fallback...");
          const fallbackStream = await streamWithRetry(question, chatHistory, category, "fallback", 0);
          const reader = fallbackStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
          return;
        }

        if (isQuota && llmMode === "fallback") {
          console.warn("-> Fallback quota hit. Failing permanently.");
          controller.error(new Error(getFriendlyFallbackMessage(error)));
          return;
        }

        if (isTransient && llmMode === "primary" && attempt < MAX_RETRIES) {
          console.warn(`-> Transient error (Attempt ${attempt + 1}/${MAX_RETRIES}). Retrying...`);
          const waitMs = RETRY_DELAY_MS * (attempt + 1);
          await new Promise((r) => setTimeout(r, waitMs));

          const retryStream = await streamWithRetry(question, chatHistory, category, llmMode, attempt + 1);
          const reader = retryStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
          return;
        }

        console.error("-> FAILED PERMANENTLY");
        controller.error(new Error(getFriendlyFallbackMessage(error)));
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