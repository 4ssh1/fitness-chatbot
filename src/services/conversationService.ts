import { getMongoDb } from "../lib/mongodb";

export async function getOrCreateConversation(
  userId: string,
  sessionId: string
) {
  const db = await getMongoDb();
  const conversations = db.collection("conversations");
  const result = await conversations.findOneAndUpdate(
    { sessionId },
    { $setOnInsert: { sessionId, userId } },
    { upsert: true, returnDocument: "after" }
  );
  return result;
}
