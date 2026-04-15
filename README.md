# GbeBody AI

GbeBody AI is a Nigerian-context fitness assistant built with Next.js, LangChain, Google Gemini, and MongoDB Atlas Vector Search. It streams answers for workouts, nutrition, and exercise technique, with category-specific retrieval and chat persistence for both guests and signed-in users.

---
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB%20(%2BVector%20Search)-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash-00C7B7?style=for-the-badge&logo=upstash&logoColor=white)
## Core Features

- Streaming AI responses using `ReadableStream` from `/api/ai`
- Retrieval-Augmented Generation (RAG) over local knowledge files in `src/data/*.json`
- Category-aware retrieval with metadata pre-filters (`all`, `food`, `workouts`, `form`)
- Prompt-injection pattern checks and request validation (Zod)
- Rate limiting via Upstash (`15 requests / minute` sliding window)
- Authenticated chat persistence in MongoDB (`chats` collection)
- Guest + auth session caching in IndexedDB for fast hydration
- Auto title generation for new chats via Gemini Flash Lite (`/api/chat/title`)

---

## How It Works

### 1) Client flow (`src/components/chat/ChatWindow.tsx`)

- Loads cached messages first from IndexedDB
- If authenticated, syncs with `/api/chat?sessionId=...`
- Sends messages to `/api/ai` and renders streamed chunks live
- Saves successful conversations through `/api/chat`
- Triggers one-time AI title generation on the first successful user message

### 2) AI route (`src/app/api/ai/route.ts`)

- Checks origin against allow-list (`NEXT_PUBLIC_APP_URL` and localhost)
- Applies Upstash rate limiting by userId or IP fallback
- Rejects oversized payloads (`content-length > 16000`)
- Validates request body with `ChatRequestSchema`
- Performs basic prompt-injection pattern checks
- Assigns and stores a guest `userId` cookie when needed
- Streams response from `askRAG(...)`

### 3) RAG service (`src/services/ragService.ts`)

- Embeddings model: `gemini-embedding-001`
- Generation model: `gemini-2.5-flash` with fallback to `gemini-2.5-flash-lite`
- Uses Atlas Vector Search retriever (`k: 5`)
- Applies metadata `preFilter` by `source` for non-`all` categories
- Includes retry logic for transient failures and graceful quota fallback

### 4) Chat persistence routes

- `GET /api/chat`: fetch one session or list chat sessions
- `POST /api/chat`: upsert full session message history
- `PATCH /api/chat`: rename/update chat title
- `DELETE /api/chat`: delete session
- `POST /api/chat/title`: generate and store an AI short title (authenticated users)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Auth | NextAuth (Google provider, JWT sessions) |
| AI Models | Gemini 2.5 Flash + Flash Lite fallback via LangChain |
| Embeddings | `gemini-embedding-001` |
| Vector Store | MongoDB Atlas Vector Search |
| Database | MongoDB (`users`, `chats`, `knowledge_chunks`) |
| Validation | Zod |
| Rate Limiting | Upstash Ratelimit (`@upstash/ratelimit`, `@upstash/redis`) |
| Client Cache | IndexedDB (`idb`) |
| UI | Next.js + Tailwind CSS |

---

## Environment Variables

Create a `.env.local` with:

```bash
# Gemini
GEMINI_API_KEY=

# MongoDB
DATABASE_URL=
MONGODB_DB_NAME=rag_db
MONGODB_COLLECTION_NAME=knowledge_chunks

# NextAuth / Google OAuth
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Origin allow-list used by /api/ai
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Upstash rate limiting (matches src/lib/rateLimit.ts)
UPSTASH_KV_REST_API_URL=
UPSTASH_KV_REST_API_TOKEN=
```

---

## Local Development

```bash
npm install
npm run dev
```

Optional: ingest/update your knowledge base after changing files in `src/data`:

```bash
curl -X POST http://localhost:3000/api/ingest
```

---

## MongoDB Atlas Vector Search Setup

1. Create your Atlas cluster and set `DATABASE_URL`.
2. Ensure the target DB/collection match `MONGODB_DB_NAME` and `MONGODB_COLLECTION_NAME`.
3. Ingest data through `POST /api/ingest`.
4. In Atlas, create a Vector Search index on `knowledge_chunks` named `vector_index`.

Use this index definition (includes filter fields used by category retrieval):

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 3072,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "source"
    },
    {
      "type": "filter",
      "path": "type"
    }
  ]
}
```

Why filters are included:

- `source` is used in retriever `preFilter` to scope category results (for example, food mode only searches food/meal-plan docs).
- `type` is available for future narrowing and analytics by chunk type.

Example category filter shape used in code:

```ts
filter: {
  preFilter: {
    source: { $in: ["foods.json", "meal-plan.json"] }
  }
}
```

---

## Notes

- Guest chats are cached per browser tab in IndexedDB and can be cleared when the tab session is stale.
- Authenticated chats are cached locally first, then synchronized with MongoDB.
- Title generation gracefully falls back to first-message truncation if model generation fails.

