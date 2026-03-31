import db from "../db";

export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM"
}

export async function saveMessage(
  conversationId: number,
  role: MessageRole,
  content: string
) {
  await db.message.create({
    data: {
      conversationId,
      role,
      content,
    },
  });
}
