import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { askRAG } from "@/services/ragService";
import { ChatRequestSchema } from "@/validation/user";
import { ratelimit } from "@/lib/rateLimit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

function detectCategory(text: string): string {
  if (/(food|eat|meal|protein|calorie|macro|nutrition|diet|carb|fat|cook|recipe)/i.test(text))
    return "food";
  if (/(workout|exercise|training|lift|gym|cardio|split|program|rep|set|push|pull)/i.test(text))
    return "workouts";
  if (/(form|technique|cue|squat|deadlift|bench|posture|movement|hinge|mistake)/i.test(text))
    return "form";
  return "all";
}

const INJECTION_PATTERNS = [
  /ignore (previous|prior|all) instructions/i,
  /system prompt/i,
  /you are now/i,
  /forget (everything|your instructions)/i,
  /act as (a )?(different|new|another)/i,
  /jailbreak/i,
  /\[INST\]|\[\/INST\]/i,
];

function isPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const origin = req.headers.get("origin");
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"];
  console.log(allowedOrigins!)
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  let userId = session?.user?.id || cookieStore.get("userId")?.value;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  const identifier = userId ?? ip;

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Slow down a bit!" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }

  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 16_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userMessage, category, history } = parsed.data;

    if (isPromptInjection(userMessage)) {
      return NextResponse.json({ error: "Invalid message content." }, { status: 400 });
    }

    const detectedCategory = category === "all" ? detectCategory(userMessage) : category;
    const categoryHint =
      detectedCategory !== "all"
        ? `\n\nContext hint: the user is asking about ${detectedCategory} — lean towards ${detectedCategory}-related advice where relevant, but still answer the full question.`
        : "";

    let isNewUserId = false;
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      isNewUserId = true;
    }

    const stream = await askRAG(userMessage, history, categoryHint);

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
        `userId=${userId}; Max-Age=${60 * 60 * 24 * 365}; Path=/; HttpOnly; SameSite=Lax${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
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