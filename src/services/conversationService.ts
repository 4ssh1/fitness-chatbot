import db from "../db";

export async function getOrCreateConversation(userId: number, sessionId: string) {
  return db.conversation.upsert({
    where: { sessionId },
    update: {},
    create: {
      sessionId,
      userId: userId.toString(),
    },
  });
}
