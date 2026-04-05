import {
  createOrGetUserByExternalId,
  updateUserGender,
} from "./userService";
import { getOrCreateConversation } from "./conversationService";
import { saveMessage } from "./messageService";
import { HistoryItem } from "@/types/chat";
import { MessageRole } from "./messageService";
import { askRAG } from "./ragService";

interface CreateChatStreamOptions {
  prompt: string;
  history: HistoryItem[];
  userGender?: string;
  sessionId?: string;
  externalUserId: string;
  categoryHint?: string;
  userId?: string;
}

export async function createChatStream({
  prompt,
  history,
  userGender,
  sessionId,
  externalUserId,
  categoryHint = "",
  userId,
}: CreateChatStreamOptions): Promise<ReadableStream> {
  const finalSessionId = sessionId || `session_${Date.now()}`;
  const chatHistory = history.map((h) => `${h.role}: ${h.content}`).join("\n");

  // Ran DB setup AND RAG in parallel so Mongo block the LLM
  const [ragStream, conversationId] = await Promise.all([
    askRAG(prompt, chatHistory, categoryHint),
    (async () => {
      if (!userId) {
        return null;
      }
      const userResult = await createOrGetUserByExternalId(externalUserId);
      const user = userResult.value;

      if (!user) {
        // Handle the case where the user is not found or created
        return null;
      }

      const [conversationResult] = await Promise.all([
        getOrCreateConversation(user._id.toString(), finalSessionId),
        userGender
          ? updateUserGender(externalUserId, userGender)
          : Promise.resolve(),
      ]);
      await saveMessage(
        conversationResult.value!._id.toString(),
        "user" as MessageRole,
        prompt
      );
      return conversationResult.value!._id.toString();
    })(),
  ]);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = ragStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(encoder.encode(value));
        }
      } catch (error) {
        console.error("Error reading from ragStream", error);
        controller.error(error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return stream;
}