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

  const user = await createOrGetUserByExternalId(externalUserId);

  if (userGender) {
    await updateUserGender(externalUserId, userGender);
  }

  const finalSessionId = sessionId || `session_${Date.now()}`;
  const conversationResult = await getOrCreateConversation(
    user!._id.toString(),
    finalSessionId
  );
  const conversation = conversationResult!;

  await saveMessage(conversation._id.toString(), "user" as MessageRole, prompt);

  const chatHistory = history
    .map((h) => `${h.role}: ${h.content}`)
    .join("\n");

  const ragStream = await askRAG(prompt, chatHistory, categoryHint);

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

        if (fullResponse.trim()) {
          await saveMessage(
            conversation._id.toString(),
            "assistant" as MessageRole,
            fullResponse
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