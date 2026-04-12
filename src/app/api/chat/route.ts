import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getMongoDb } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const db = await getMongoDb();
    const collection = db.collection("chats");

    if (sessionId) {
      const doc = await collection.findOne({ userId, sessionId });
      return NextResponse.json({
        messages: doc?.messages ?? [],
        title: doc?.title ?? "New Chat",
        category: doc?.category ?? "all",
      });
    }

    const docs = await collection
      .find({ userId }, { projection: { messages: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();

    const sessions = docs.map((doc) => ({
      sessionId: doc.sessionId,
      title: doc.title ?? "New Chat",
      category: doc.category ?? "all",
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { sessionId, messages, category, title } = await req.json();
    if (!sessionId || !Array.isArray(messages) || !category) {
      return NextResponse.json(
        { error: "Missing sessionId, messages array, or category" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const collection = db.collection("chats");

    const derivedTitle =
      title ||
      messages.find((m: any) => m.role === "user")?.content?.slice(0, 60) ||
      "New Chat";

    await collection.updateOne(
      { userId, sessionId },
      {
        $set: {
          messages,
          category,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          title: derivedTitle,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { sessionId, title } = await req.json();
    if (!sessionId || !title) {
      return NextResponse.json({ error: "Missing sessionId or title" }, { status: 400 });
    }

    const db = await getMongoDb();
    await db
      .collection("chats")
      .updateOne({ userId, sessionId }, { $set: { title, updatedAt: new Date() } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const db = await getMongoDb();
    const result = await db
      .collection("chats")
      .deleteOne({ userId, sessionId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}