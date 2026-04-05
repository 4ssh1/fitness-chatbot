import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getMongoDb } from "@/lib/mongodb";
import fs from "fs";
import path from "path";
import { Document } from "@langchain/core/documents";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});

async function getKnowledgeChunkCollection() {
  const db = await getMongoDb();
  return db.collection(process.env.MONGODB_COLLECTION_NAME || "knowledge_chunks");
}

let cachedVectorStore: MongoDBAtlasVectorSearch | null = null;

export async function getVectorStore() {
  if (cachedVectorStore) {
    return cachedVectorStore;
  }

  const collection = await getKnowledgeChunkCollection();
  cachedVectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection as any,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });

  return cachedVectorStore;
}

let cachedRetriever: any = null;
let cachedChain: RunnableSequence | null = null;

async function getRetriever() {
  if (cachedRetriever) {
    return cachedRetriever;
  }
  const vectorStore = await getVectorStore();
  cachedRetriever = vectorStore.asRetriever({ k: 4 });
  return cachedRetriever;
}

async function getChain() {
  if (cachedChain) {
    return cachedChain;
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

  cachedChain = RunnableSequence.from([
    {
      context: async (input: { question: string; chatHistory?: string; categoryHint?: string }) => {
        const docs = await retriever.invoke(input.question);
        return docs.map((d: Document) => d.pageContent).join("\n\n");
      },
      chatHistory: (input: { question: string; chatHistory?: string; categoryHint?: string }) => input.chatHistory ?? "",
      question: (input: { question: string; chatHistory?: string; categoryHint?: string }) => input.question,
      categoryHint: (input: { question: string; chatHistory?: string; categoryHint?: string }) => input.categoryHint ?? "",
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return cachedChain;
}


export async function ingestKnowledgeBase() {
  const collection = await getKnowledgeChunkCollection();
  await collection.deleteMany({});

  const files = [
    "foods.json",
    "meal-plan.json",
    "workout.json",
    "form-guides.json",
  ];

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
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}