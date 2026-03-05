import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createChatStream } from "@/lib/services/chatService";
import { HistoryItem } from "@/types/chat";

export async function POST(req: NextRequest) {
  try {
    const { prompt, history = [], userGender, sessionId } = (await req.json()) as {
      prompt: string;
      history?: HistoryItem[];
      userGender?: string;
      sessionId?: string;
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    let userId =  cookieStore.get("userId")?.value;
    let isNewUserId = false;

    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      isNewUserId = true;
    }

    const stream = await createChatStream({
      prompt,
      history,
      userGender,
      sessionId,
      externalUserId: userId,
    });

    const res = new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });

    if (isNewUserId) {
      res.cookies.set("userId", userId, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return res;
  } catch (error: any) {
    console.error("Gemini API error:", error);
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
    model: "gemini-2.0-flash-exp",
  });
}
