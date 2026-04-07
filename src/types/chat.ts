export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface HistoryItem {
  role: ChatRole;
  content: string;
}
