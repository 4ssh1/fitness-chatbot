import { getMongoDb } from "../lib/mongodb";
import { ObjectId } from "mongodb";

export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM",
}

export async function saveMessage(
  conversationId: string,
  role: MessageRole,
  content: string
) {
  const db = await getMongoDb();
  const messages = db.collection("messages");
  await messages.insertOne({
    conversationId: new ObjectId(conversationId),
    role,
    content,
    createdAt: new Date(),
  });
}
