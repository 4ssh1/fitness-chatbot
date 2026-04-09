import { NextResponse } from "next/server";
import { ingestKnowledgeBase } from "@/services/ragService";

export async function POST() {
  try {
    await ingestKnowledgeBase();
    return NextResponse.json({ success: true, message: "Knowledge base ingested successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Ingestion failed.", detail: error?.message },
      { status: 500 }
    );
  }
}