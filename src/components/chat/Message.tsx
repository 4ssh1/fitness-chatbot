import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`msg-animate flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}
    >
      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gray-800 text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm border border-border"
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mt-1 [&_li]:mb-1 [&_strong]:text-primary [&_h3]:font-display [&_h3]:text-base [&_h3]:mt-2">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <p className="text-[10px] mt-1 opacity-50 text-right">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
