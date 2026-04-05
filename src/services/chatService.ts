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
}

export async function createChatStream({
  prompt,
  history,
  userGender,
  sessionId,
  externalUserId,
  categoryHint = "",
}: CreateChatStreamOptions): Promise<ReadableStream> {
  const finalSessionId = sessionId || `session_${Date.now()}`;
  const chatHistory = history.map((h) => `${h.role}: ${h.content}`).join("\n");

  // Ran DB setup AND RAG in parallel so Mongo block the LLM
  const [ragStream, conversationId] = await Promise.all([
    askRAG(prompt, chatHistory, categoryHint),
    (async () => {
      const user = await createOrGetUserByExternalId(externalUserId);
      const [conversationResult] = await Promise.all([
        getOrCreateConversation(user!._id.toString(), finalSessionId),
        userGender
          ? updateUserGender(externalUserId, userGender)
          : Promise.resolve(),
      ]);
      await saveMessage(
        conversationResult!._id.toString(),
        "user" as MessageRole,
        prompt
      );
      return conversationResult!._id.toString();
    })(),
  ]);

  let fullResponse = "";

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = ragStream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;
          controller.enqueue(encoder.encode(chunk));
        }

        // Fire and forget, don't block stream close on this
        if (fullResponse.trim()) {
          saveMessage(conversationId, "assistant" as MessageRole, fullResponse).catch(
            (err) => console.error("Failed to save assistant message:", err)
          );
        }

        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      }
    },
  });
}