import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getMongoDb } from "@/lib/mongodb";
import fs from "fs";
import path from "path";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004", // or gemini-embedding-exp-03-07
  apiKey: process.env.GEMINI_API_KEY,
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", // or gemini-1.5-pro
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});

async function getKnowledgeChunkCollection() {
  const db = await getMongoDb();
  return db.collection(process.env.MONGODB_COLLECTION_NAME || "knowledge_chunks");
}

export async function getVectorStore() {
  const collection = await getKnowledgeChunkCollection();

  return new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection as any,
    indexName: "vector_index",
    textKey: "text",
    embeddingKey: "embedding",
  });
}

// Ingest your existing JSON data (run once or via admin route)
export async function ingestKnowledgeBase() {
  const collection = await getKnowledgeChunkCollection();
  await collection.deleteMany({}); // clear previous

  // Example: load your data folder files
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

  console.log("✅ Knowledge base ingested into MongoDB Vector Search");
}

export async function askRAG(question: string, chatHistory: string = ""): Promise<ReadableStream> {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever({ k: 6 });

  const prompt = PromptTemplate.fromTemplate(`
You are a helpful fitness and nutrition assistant specialized in Nigerian foods and workout plans.

Use the following context to answer the user's question.
If you don't know, say you don't have enough information.

Context: {context}

Chat History: {chatHistory}

Question: {question}
Answer in a friendly, motivating tone:
`);

  const chain = RunnableSequence.from([
    {
      context: async (input: { question: string }) => {
        const docs = await retriever.invoke(input.question);
        return docs.map((d) => d.pageContent).join("\n\n");
      },
      chatHistory: () => chatHistory,
      question: (input: { question: string }) => input.question,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  const langchainStream = await chain.stream({ question });

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
