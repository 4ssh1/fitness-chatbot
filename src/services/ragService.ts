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

// LLM / Embeddings — module-level singletons are fine (no DB dependency)
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});

// Global cache — survives Next.js hot-reloads in dev the same way clientPromise does

declare global {
  var _cachedVectorStore: MongoDBAtlasVectorSearch | undefined;
  var _cachedRetriever: any;
  var _cachedChain: RunnableSequence | undefined;
}

// Vector store
// Pass `clientPromise` (the MongoClient promise) directly to
// MongoDBAtlasVectorSearch instead of a bare collection object.
// The constructor accepts { collection } OR { clientPromise, dbName, collectionName }.
// Using clientPromise avoids the internal `.client` access timing issue.

export async function getVectorStore(): Promise<MongoDBAtlasVectorSearch> {
  if (global._cachedVectorStore) {
    return global._cachedVectorStore;
  }

  const collectionName = process.env.MONGODB_COLLECTION_NAME || "knowledge_chunks";
  const dbName = process.env.MONGODB_DB_NAME || "rag_db";

  // Wait for the client to be fully connected before handing it to LangChain
  const mongoClient = await clientPromise;
  // Cast to `any` — LangChain bundles its own mongodb types that may differ
  // from your installed driver version; they're identical at runtime.
  const collection = mongoClient.db(dbName).collection(collectionName) as any;

  global._cachedVectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });

  return global._cachedVectorStore;
}

// Retriever

async function getRetriever() {
  if (global._cachedRetriever) {
    return global._cachedRetriever;
  }
  const vectorStore = await getVectorStore();
  global._cachedRetriever = vectorStore.asRetriever({ k: 4 });
  return global._cachedRetriever;
}

// RAG chain

async function getChain(): Promise<RunnableSequence> {
  if (global._cachedChain) {
    return global._cachedChain;
  }

  const retriever = await getRetriever();

  const prompt = PromptTemplate.fromTemplate(`
You are a helpful fitness and nutrition assistant specialized in Nigerian foods and workout plans.

Use the context below if it's relevant. If the context doesn't cover the question, answer from your own fitness knowledge — do NOT say you don't have enough information.
{categoryHint}

Context: {context}

Chat History: {chatHistory}

Question: {question}
Answer in a friendly, motivating tone:
`);

  global._cachedChain = RunnableSequence.from([
    {
      context: async (input: { question: string; chatHistory?: string; categoryHint?: string }) => {
        const docs = await retriever.invoke(input.question);
        return docs.map((d: Document) => d.pageContent).join("\n\n");
      },
      chatHistory: (input: { question: string; chatHistory?: string; categoryHint?: string }) =>
        input.chatHistory ?? "",
      question: (input: { question: string; chatHistory?: string; categoryHint?: string }) =>
        input.question,
      categoryHint: (input: { question: string; chatHistory?: string; categoryHint?: string }) =>
        input.categoryHint ?? "",
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return global._cachedChain;
}

// Ingest (one-time script, not called at runtime)


export async function ingestKnowledgeBase() {
  // For ingestion we still go through getMongoDb() — that's fine for a script
  const db = await getMongoDb();
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME || "knowledge_chunks");
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
  }

  console.log("Knowledge base ingested into MongoDB Vector Search");
}

// Main export — called per-request


export async function askRAG(
  question: string,
  chatHistory: string = "",
  categoryHint: string = ""
): Promise<ReadableStream> {
  const chain = await getChain();

  const langchainStream = await chain.stream({
    question,
    chatHistory,
    categoryHint,
  });

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of langchainStream) {
          if (chunk && typeof chunk === "string") {
            const encoded = encoder.encode(chunk);
            controller.enqueue(encoded);
          } else if (chunk) {
            controller.enqueue(encoder.encode(String(chunk)));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}