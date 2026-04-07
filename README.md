# GbeBody AI

A Nigerian-context fitness chatbot built with Next.js, LangChain, Google Gemini, and MongoDB Atlas Vector Search. It answers questions about workouts, nutrition, and exercise form with Nigerian food alternatives, pidgin flavour, and gender-specific advice.

---

## Features

- **Streaming responses**  token-by-token output via `ReadableStream`, no waiting for full completion
- **RAG pipeline**  answers are grounded in a custom knowledge base (foods, meal plans, workouts, form guides) stored as vector embeddings in MongoDB Atlas
- **Category routing**  four modes: All Topics, Nutrition, Workouts, Form & Technique. Auto-detection falls back to keyword matching when in "all" mode
- **Gender-aware advice**  workout plans, calorie targets, and tone adjust based on user gender
- **Nigerian context**  recommends locally available foods (jollof, eba, titus fish, groundnut), acknowledges budget constraints, NEPA challenges, and home workout setups
- **Conversation persistence**  every message is saved to MongoDB with user, conversation, and message collections
- **Rotating loading tips**  category-aware fitness tips cycle while the AI is generating

---

## Architecture

The application is built on a client-server model featuring a Retrieval-Augmented Generation (RAG) pipeline to deliver contextual and accurate AI-driven fitness advice.

### Request Lifecycle

1.  **Frontend Interaction (`ChatWindow.tsx`)**: The user sends a message from the Next.js client. The chat history, category, and user message are bundled and streamed to the backend.
2.  **API  (`api/ai/route.ts`)**: A dedicated API route receives the request and performs several critical middleware functions:
    *   **Security**: Validates the request payload, checks for prompt injection, and enforces rate limiting using Upstash Redis.
    *   **Category Routing**: If the user-selected category is "All Topics," it detects the most relevant category from the message to narrow the search context.
    *   **Session Management**: Assigns a guest `userId` via cookies if the user is not authenticated.
3.  **RAG Service (`ragService.ts`)**: This is the core engine of the application. It orchestrates the retrieval and generation process:
    *   **Retrieval**: It performs a semantic search against a MongoDB Atlas Vector Search index to find the top 4 most relevant knowledge chunks related to the user's query.
    *   **Context Augmentation**: The retrieved chunks are combined with the chat history and the original user question to form a comprehensive prompt.
    *   **Generation**: The augmented prompt is sent to the Google Gemini 2.5 Flash model, which generates a response. The response is streamed back token-by-token.
4.  **Response Streaming**: The backend streams the response directly to the client, allowing the user to see the answer as it's being generated.
5.  **Persistence**: Upon response completion, the conversation is saved. Authenticated user chats are stored in a MongoDB `chats` collection via the `/api/chat` endpoint, while guest chats are persisted locally in the browser's IndexedDB.

### Data Flow 

- Client to Server: The user's input initiates a POST request to /api/ai and is validated.

- Server to Engine (RAG): The request is passed to your RAG Service, which interacts with MongoDB Atlas to perform a vector search for relevant context.

- Engine to LLM: The context and query are sent to Google Gemini, which generates the response and streams tokens back to the engine.

- Streaming Back: The tokens stream continuously from the Engine to the Server, and then to the Client UI, where they are displayed in real-time.

- Persistence: Finally, a separate POST request handles saving the full conversation history to MongoDB.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI Model | Google Gemini 2.5 Flash via LangChain |
| Embeddings | `gemini-embedding-001` |
| Vector Search | MongoDB Atlas Vector Search |
| Database | MongoDB (users, conversations, messages, knowledge_chunks) |
| Rate Limiting | Upstash Redis (sliding window) |
| Validation | Zod |
| Styling | Tailwind CSS + custom CSS variables |
| Markdown rendering | `react-markdown` |

---

## Environment Variables

```bash
# Google Gemini
GEMINI_API_KEY=

# MongoDB
DATABASE_URL=
MONGODB_DB_NAME=rag_db
MONGODB_COLLECTION_NAME=knowledge_chunks

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

---

## Getting Started

```bash
# Install dependencies
npm install

npm run dev
```

### MongoDB Atlas Setup

1. Create a cluster and get your connection string (`DATABASE_URL`)
2. Create a database named `ai_db`
3. After ingestion, go to **Atlas Search → Create Index** on the `knowledge_chunks` collection
4. Use this index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 3072,
      "similarity": "cosine"
    }
  ]
}
```

5. Name the index `anything`

