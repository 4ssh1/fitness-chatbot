import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getMongoDb } from "@/lib/mongodb";
import { authOptions } from "../auth/[...nextauth]/route";


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";

    const db = await getMongoDb();
    const collection = db.collection("chats");

    const doc = await collection.findOne({ userId, category });
    return NextResponse.json({ messages: doc?.messages || [] });
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

    const { messages, category } = await req.json();
    if (!Array.isArray(messages) || !category) {
      return NextResponse.json(
        { error: "Missing messages array or category" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const collection = db.collection("chats");

    await collection.updateOne(
      { userId, category },
      {
        $set: {
          messages,
          updatedAt: new Date(),
        },
        $setOnInsert: {
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "Missing category" }, { status: 400 });
    }

    const db = await getMongoDb();
    const collection = db.collection("chats");

    const result = await collection.deleteOne({ userId, category });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chat history not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}