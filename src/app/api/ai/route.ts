import { NextRequest, NextResponse } from "next/server";
import { HistoryItem } from "@/types/chat";
import { User } from "@/types/user";
import { buildContextPrompt, buildMessages } from "@/lib/helpers";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
           
function detectCategory(text: string): string {
  if (/(food|eat|meal|protein|calorie|macro|nutrition|diet|carb|fat|cook|recipe)/i.test(text))
    return "food";
  if (/(workout|exercise|training|lift|gym|cardio|split|program|rep|set|push|pull)/i.test(text))
    return "workouts";
  if (/(form|technique|cue|squat|deadlift|bench|posture|movement|hinge|mistake)/i.test(text))
    return "form";
  return "all";
}

export async function POST(req: NextRequest) {
  const { userMessage, category, history = [], user } = (await req.json()) as {
    userMessage: string;
    category: string;
    history: HistoryItem[];
    user?: User | null;
  };

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  const detectedCategory = category === "all" ? detectCategory(userMessage) : category;

  const categoryHint =
    detectedCategory !== "all"
      ? `\n\nThe user is currently in ${detectedCategory.toUpperCase()} mode — prioritise responses related to ${detectedCategory}.`
      : "";

  const contextPrompt = buildContextPrompt(user) + categoryHint;
  const messages = buildMessages(contextPrompt, history, userMessage);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini API error:", err);
      return NextResponse.json(
        { error: "Something went wrong on the AI's end." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "The AI did not provide a response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: text.trim() });
  } catch (error) {
    console.error("Network error calling Gemini:", error);
    return NextResponse.json(
      { error: "Network issue calling the AI service." },
      { status: 503 }
    );
  }
}
