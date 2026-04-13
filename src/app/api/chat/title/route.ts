import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const titleLlm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash-latest",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.3, // low temp = consistent, concise output
});


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { sessionId, firstUserMessage } = body;

    if (!sessionId || !firstUserMessage) {
      return NextResponse.json(
        { error: "Missing sessionId or firstUserMessage" },
        { status: 400 }
      );
    }

    let title = "";
    try {
      const prompt = `You are a chat title generator for a fitness and nutrition app called Gbebody AI.

Given the user's first message, generate a short, specific chat title.

Rules:
- Maximum 6 words
- Title case (e.g. "Building Muscle on a Budget")
- No punctuation at the end
- Be specific, not generic — avoid titles like "Fitness Question" or "Workout Help"
- Reflect the actual topic of the message

User message: "${firstUserMessage.slice(0, 300)}"

Respond with ONLY the title, nothing else.`;

      const response = await titleLlm.invoke(prompt);
      const rawTitle =
        typeof response.content === "string"
          ? response.content.trim()
          : String(response.content).trim();

      title = rawTitle.replace(/^['"]|['"]$/g, "").slice(0, 80) || firstUserMessage.slice(0, 60);
    } catch (err) {
      // Fallback: use first 10 words from user's message
      title = firstUserMessage.split(/\s+/).slice(0, 10).join(" ");
    }

    const db = await getMongoDb();
    await db
      .collection("chats")
      .updateOne(
        { userId, sessionId },
        { $set: { title, updatedAt: new Date() } }
      );

    return NextResponse.json({ title });
  } catch (error) {
    try {
      const body = await req.json();
      const { firstUserMessage } = body || {};
      const fallbackTitle = firstUserMessage
        ? firstUserMessage.split(/\s+/).slice(0, 10).join(" ")
        : "Chat";
      return NextResponse.json({ title: fallbackTitle, error: "Title generation failed, fallback used" }, { status: 200 });
    } catch {
      return NextResponse.json({ error: "Title generation failed" }, { status: 500 });
    }
  }
}