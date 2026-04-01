import { HistoryItem } from "@/types/chat";
import { SYSTEM_PROMPT } from "./systemPrompts";
import { User } from "@/types/user";

export function detectGender(message: string): "male" | "female" | null {
  const lower = message.toLowerCase();

  if (
    lower.includes("female") ||
    lower.includes("woman") ||
    lower.includes("lady") ||
    lower.includes("girl") ||
    /\bi'?m a (lady|woman|girl|female)\b/.test(lower)
  ) {
    return "female";
  }

  if (
    lower.includes("male") ||
    lower.includes("man") ||
    lower.includes("guy") ||
    lower.includes("boy") ||
    /\bi'?m a (guy|man|boy|male)\b/.test(lower)
  ) {
    return "male";
  }

  return null;
}

export function buildContextPrompt(user?: User | null): string {
  let contextPrompt = SYSTEM_PROMPT;

  if (user?.gender) {
    contextPrompt += `\n\nUSER GENDER: ${user.gender}`;
    contextPrompt += `\nAdjust your advice specifically for ${
      user.gender === "male" ? "males" : "females"
    }.`;
  }

  if (user?.fitnessLevel) {
    contextPrompt += `\nUSER FITNESS LEVEL: ${user.fitnessLevel}`;
  }

  return contextPrompt;
}

export function buildMessages(
  contextPrompt: string,
  history: HistoryItem[],
  prompt: string
) {
  return [
    {
      role: "user",
      parts: [{ text: contextPrompt }],
    },
    {
      role: "model",
      parts: [{ text: "Understood! I am GbeBody Coach and will follow these guidelines exactly." }],
    },
    ...history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];
}
