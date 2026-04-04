import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createChatStream } from "@/services/chatService";
import { HistoryItem } from "@/types/chat";

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
  try {
    const {
      userMessage,
      category = "all",
      history = [],
      userGender,
      sessionId,
    } = (await req.json()) as {
      userMessage: string;
      category?: string;
      history?: HistoryItem[];
      userGender?: string;
      sessionId?: string;
    };

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // If user is in "all" mode, auto-detect category from the message content
    const detectedCategory = category === "all" ? detectCategory(userMessage) : category;
    const categoryHint =
      detectedCategory !== "all"
        ? `\n\nContext hint: the user is asking about ${detectedCategory} — lean towards ${detectedCategory}-related advice where relevant, but still answer the full question.`
        : "";

    const cookieStore = await cookies();
    let userId = cookieStore.get("userId")?.value;
    let isNewUserId = false;

    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      isNewUserId = true;
    }

    const stream = await createChatStream({
      prompt: userMessage,
      history,
      userGender,
      sessionId,
      externalUserId: userId,
      categoryHint,
    });

    const response = new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-User-Id": userId,
        "X-Is-New-User": isNewUserId ? "true" : "false",
      },
    });

    if (isNewUserId) {
      response.headers.append(
        "Set-Cookie",
        `userId=${userId}; Max-Age=${60 * 60 * 24 * 365}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );
    }

    return response;
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate response",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "GbeBody Chat API is running",
  });
}