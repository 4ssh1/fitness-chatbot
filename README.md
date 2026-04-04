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

---

## Known Limitations

- No authentication yet  users are identified by a cookie-based anonymous ID. Auth is planned.
- The `config.api.bodyParser` export in `route.ts` is Pages Router syntax and has no effect in App Router. The manual `content-length` check covers this instead.
- Voice input button exists in the UI but is not yet wired up.