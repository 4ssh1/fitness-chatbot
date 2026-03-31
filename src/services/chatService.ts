import { buildContextPrompt, buildMessages, detectGender } from "../helpers";
import { createOrGetUserByExternalId, getUserByExternalId, updateUserGender } from "./userService";
import { getOrCreateConversation } from "./conversationService";
import { saveMessage } from "./messageService";
import { HistoryItem } from "@/types/chat";
import { MessageRole } from "./messageService";
import { googleAI } from "../gemini";

interface CreateChatStreamOptions {
  prompt: string;
  history: HistoryItem[];
  userGender?: string;
  sessionId?: string;
  externalUserId: string;
}

export async function createChatStream({
  prompt,
  history,
  userGender,
  sessionId,
  externalUserId,
}: CreateChatStreamOptions): Promise<ReadableStream> {

  await createOrGetUserByExternalId(externalUserId);
  const user = await getUserByExternalId(externalUserId);

  let finalGender = userGender;
  if (!finalGender) {
    finalGender = detectGender(prompt) ?? undefined;
  }
  if (finalGender) {
    await updateUserGender(externalUserId, finalGender);
  }

  const refreshedUser = await getUserByExternalId(externalUserId);

  const finalSessionId = sessionId || `session_${Date.now()}`;
  const conversation = await getOrCreateConversation(refreshedUser!.id, finalSessionId);

  await saveMessage(conversation.id, "user" as MessageRole, prompt);

  const contextPrompt = buildContextPrompt(refreshedUser);
  const messages = buildMessages(contextPrompt, history, prompt);

  const resultPromise = googleAI.models.generateContentStream({
    model: "gemini-2.0-flash-exp",
    config: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      topP: 0.95,
      topK: 40,
    },
    contents: messages,
  } as any); // cast because types may differ slightly between versions

  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const result = await resultPromise;

        for await (const chunk of result as any) {
          const text = (chunk as any).text as string;
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        if (fullResponse.trim()) {
          await saveMessage(conversation.id, "assistant" as MessageRole, fullResponse);
        }

        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      }
    },
  });

  return stream;
}
