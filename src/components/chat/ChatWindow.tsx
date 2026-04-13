"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { IoSend, IoStop, IoClose } from "react-icons/io5";
import { MdRefresh } from "react-icons/md";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { useSession, signIn } from "next-auth/react";
import { MicButton } from "@/components/chat/Mic";
import { useToast } from "@/hooks/useToast";
import { type ChatSession } from "./Category";
import {
  saveGuestSession,
  loadGuestSession,
} from "@/lib/indexedDB";

const MAX_CHARS = 1000;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  failed?: boolean; 
}

interface ChatWindowProps {
  sessionId: string;
  category: "all" | "food" | "workouts" | "form";
  onNewChat: () => void;
  onSessionSaved: (session: ChatSession) => void;
}

export const GREETINGS: Record<string, string> = {
  all: "Hey! I'm **Gbebody AI**, your personal fitness assistant \n\n What's your goal today?",
  food: "**Nutrition Mode** activated!\n\nI can help with meal plans, macros, calorie targets, pre/post workout nutrition, and healthy recipes. What are you working towards?",
  workouts:
    "**Workout Mode** activated!\n\nI'll help you build programs, plan splits, track progressive overload, and choose the right exercises. What are we training today?",
  form: "**Form & Technique Mode** activated!\n\nI'll guide you through proper movement patterns, cues to watch for, and how to avoid injury. Which exercise or movement do you want to nail?",
};

const normalizeMessages = (msgs: any[]): Message[] =>
  msgs.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    failed: undefined,
  }));

const withoutGreeting = (msgs: Message[]) => msgs.filter((m) => m.id !== "greeting");
const withoutFailed = (msgs: Message[]) => msgs.filter((m) => !m.failed);

const getApiErrorMessage = async (response: Response): Promise<string> => {
  const fallbackMessage = `API error: ${response.status}`;

  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  } catch {
    // Ignore JSON parse errors and use fallback status text.
  }

  return fallbackMessage;
};

const STREAMED_ERROR_PREFIXES = [
  "I'm currently hitting AI provider quota limits.",
  "I ran into a temporary AI service issue while generating this reply.",
  "Too many requests. Slow down a bit!",
  "Failed to generate response",
  "Invalid message content.",
  "Request too large",
  "Invalid request",
];

const isStreamedErrorReply = (content: string): boolean => {
  const normalized = content.trim().toLowerCase();
  if (!normalized) return false;

  return STREAMED_ERROR_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix.toLowerCase())
  );
};

export function ChatWindow({ sessionId, category, onNewChat, onSessionSaved }: ChatWindowProps) {
  const [greetingContent, setGreetingContent] = useState<string>(
    () => GREETINGS[category] ?? GREETINGS.all
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [showSignInBanner, setShowSignInBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const aiTitleFiredRef = useRef(false);

  const { data: session } = useSession();
  const { showError } = useToast();

  useEffect(() => {
    setGreetingContent(GREETINGS[category] ?? GREETINGS.all);
  }, [category]);

  useEffect(() => {
    aiTitleFiredRef.current = false;

    const loadMessages = async () => {
      setIsLoading(true);

      try {
        if (session) {
          const res = await fetch(`/api/chat?sessionId=${sessionId}`);
          if (!res.ok) {
            throw new Error(`Failed to sync chat from server (${res.status}).`);
          }

          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const serverMsgs = withoutGreeting(normalizeMessages(data.messages));
            setMessages(serverMsgs);
          } else {
            setMessages([]);
          }
        } else {
          const cached = await loadGuestSession(category);
          if (cached && cached.length > 0) {
            setMessages(withoutGreeting(normalizeMessages(cached)));
          } else {
            setMessages([]);
          }
        }
      } catch {
        showError("Failed to load chat. Please try again.");
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId, category, session?.user?.id ?? ""]);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsTyping(false);
    setHasStartedReceiving(false);
  }, []);

  const persistMessages = useCallback(
    async (finalMessages: Message[]) => {
      const toSave = withoutFailed(finalMessages);
      if (toSave.length === 0) return;

      if (session) {
        try {
          const firstUser = toSave.find((m) => m.role === "user");
          const title = firstUser?.content.slice(0, 60) ?? "New Chat";
          await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, messages: toSave, category, title }),
          });
          onSessionSaved({
            sessionId,
            title,
            category,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        } catch {
          showError("Failed to save chat. Your latest messages might not be saved.");
        }
      } else {
        await saveGuestSession(category, toSave);
      }
    },
    [session, sessionId, category, onSessionSaved, showError]
  );

  const executeSend = useCallback(
    async (text: string, existingUserMsgId?: string) => {
      if (!session) setShowSignInBanner(true);

      const userMsgId = existingUserMsgId ?? Date.now().toString();
      const userMsg: Message = {
        id: userMsgId,
        role: "user",
        content: text,
        timestamp: new Date(),
        failed: false,
      };

      setMessages((prev) => {
        if (existingUserMsgId) {
          return prev.map((m) =>
            m.id === existingUserMsgId ? { ...m, failed: false } : m
          );
        }
        return [...prev, userMsg];
      });

      setInput("");
      setIsTyping(true);
      setHasStartedReceiving(false);

      const assistantMsgId = `asst_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let succeeded = false;
      let finalAssistantContent = "";

      const historySnapshot = messages
        .filter((m) => !m.failed)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            userMessage: text,
            category,
            history: historySnapshot,
          }),
        });

        if (!response.ok) {
          const errorMessage = await getApiErrorMessage(response);
          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error("Empty response from AI service.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!hasStartedReceiving) setHasStartedReceiving(true);
          finalAssistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m
            )
          );
        }

        if (isStreamedErrorReply(finalAssistantContent)) {
          throw new Error(finalAssistantContent.trim());
        }

        if (finalAssistantContent.trim().length > 0) succeeded = true;
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          const errorMessage =
            typeof err?.message === "string" && err.message.trim().length > 0
              ? err.message
              : "Failed to send message. Please try again.";
          showError(errorMessage);

          setMessages((prev) =>
            prev
              .map((m) => (m.id === userMsgId ? { ...m, failed: true } : m))
              .filter((m) => m.id !== assistantMsgId)
          );
        } else {
          setMessages((prev) =>
            prev
              .map((m) => (m.id === assistantMsgId && m.content === "" ? null : m))
              .filter(Boolean) as Message[]
          );
        }
      } finally {
        abortControllerRef.current = null;
        setIsTyping(false);
        setHasStartedReceiving(false);
      }

      if (succeeded) {
        setMessages((prev) => {
          const finalMessages = prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: finalAssistantContent } : m
          );
          persistMessages(finalMessages);
          return finalMessages;
        });

        if (session && !aiTitleFiredRef.current) {
          aiTitleFiredRef.current = true;
          fetch("/api/chat/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, firstUserMessage: text }),
          })
            .then((res) => res.json())
            .then(({ title }) => {
              if (title) {
                onSessionSaved({
                  sessionId,
                  title,
                  category,
                  updatedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                });
              }
            })
            .catch(() => {});
        }
      }
    },
    [
      isTyping,
      session,
      category,
      messages,
      sessionId,
      onSessionSaved,
      persistMessages,
      hasStartedReceiving,
      showError,
    ]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || trimmed.length > MAX_CHARS) return;
      await executeSend(trimmed);
    },
    [isTyping, executeSend]
  );

  const retryMessage = useCallback(
    async (failedMsg: Message) => {
      if (isTyping) return;
      await executeSend(failedMsg.content, failedMsg.id);
    },
    [isTyping, executeSend]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setInput(val);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  const charsLeft = MAX_CHARS - input.length;
  const nearLimit = charsLeft <= 100;
  const atLimit = charsLeft === 0;
  const hasOnlyGreeting = messages.length === 0 && !isTyping;
  const canSend = input.trim().length > 0 && !isTyping && !atLimit;
  const showStopButton = isTyping && hasStartedReceiving;
  const showDisabledSendButton = isTyping && !hasStartedReceiving;

  const greetingMessage: Message = {
    id: "greeting",
    role: "assistant",
    content: greetingContent,
    timestamp: new Date(),
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black min-h-dvh">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-muted-foreground animate-pulse text-sm">
          Initializing training protocol...
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-dvh w-full bg-black bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black overflow-hidden">

      {!session && showSignInBanner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md p-1 pl-4 rounded-full shadow-2xl shadow-black/50 bg-zinc-900/80 border border-white/10 backdrop-blur-md flex items-center justify-between z-20 animate-in slide-in-from-top-4 fade-in duration-300">
          <p className="text-sm text-foreground/90 font-medium">Sign in to save progress</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => signIn()}
              className="bg-primary text-primary-foreground text-sm px-5 py-2 rounded-full font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignInBanner(false)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <IoClose className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-4 py-8 space-y-4">

          <ChatMessage key="greeting" message={greetingMessage} />

          {messages.map((msg) => {
            // Hide empty assistant placeholder while streaming
            if (msg.role === "assistant" && msg.content === "" && isTyping) return null;

            if (msg.failed) {
              return (
                <div key={msg.id} className="flex flex-row-reverse items-end gap-3">
                  <div className="max-w-[85%] flex flex-col items-end gap-1.5">
                    <div className="rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed bg-gray-800/60 text-foreground/60 border border-destructive/20">
                      <p>{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-destructive/80">
                        Failed to send
                      </span>
                      <button
                        onClick={() => retryMessage(msg)}
                        disabled={isTyping}
                        className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-0.5 rounded-full border border-primary/30 hover:bg-primary/10"
                      >
                        <MdRefresh className="size-3" />
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return <ChatMessage key={msg.id} message={msg} />;
          })}

          {isTyping && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator category={category} />
          )}
          <div className="h-32" ref={bottomRef} />
        </div>

        {hasOnlyGreeting && (
          <div className="absolute bottom-32 left-0 right-0 z-10 px-4">
            <QuickPrompts category={category} onSelect={sendMessage} />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black via-black/95 to-transparent pt-12 pb-4 px-3 sm:px-4 z-20">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">

            <div className="flex flex-1 flex-col rounded-3xl border border-white/5 bg-zinc-900/60 backdrop-blur-xl shadow-lg focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
              <div className="flex items-end gap-2 p-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about workouts, nutrition, technique…"
                  rows={1}
                  disabled={isTyping}
                  className="flex-1 resize-none bg-transparent px-2 sm:px-4 py-3 sm:py-3.5 text-[11px] sm:text-sm text-foreground outline-none min-h-11 sm:min-h-12 max-h-32 sm:max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent placeholder:text-muted-foreground/70 disabled:opacity-50 leading-relaxed"
                />
                <div className="pb-1.5 pr-1.5 shrink-0">
                  <MicButton
                    onTranscript={(text) => setInput((prev) => prev + (prev ? " " : "") + text)}
                    disabled={isTyping}
                  />
                </div>
              </div>
              {nearLimit && (
                <div className="px-4 pb-2 flex justify-end">
                  <span
                    className={`text-[10px] tracking-wide transition-colors ${
                      atLimit ? "text-destructive font-bold" : "text-muted-foreground/60"
                    }`}
                  >
                    {atLimit ? "CHARACTER LIMIT REACHED" : `${charsLeft} LEFT`}
                  </span>
                </div>
              )}
            </div>

            {showStopButton ? (
              <button
                onClick={stopStream}
                className="shrink-0 flex items-center justify-center size-[52px] mb-0.5 rounded-full bg-zinc-800 text-foreground border border-white/10 transition-all hover:bg-destructive hover:text-white hover:border-destructive hover:scale-105 active:scale-95 shadow-lg"
                aria-label="Stop response"
              >
                <IoStop className="size-5" />
              </button>
            ) : showDisabledSendButton ? (
              <button
                disabled
                className="shrink-0 flex items-center justify-center size-[52px] mb-0.5 rounded-full bg-primary/30 text-primary-foreground/50 border border-primary/20 cursor-not-allowed transition-all"
                aria-label="Waiting for response"
              >
                <IoSend className="size-5 -translate-x-px translate-y-px" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                className="shrink-0 flex items-center justify-center size-[52px] mb-0.5 rounded-full bg-primary text-primary-foreground border border-primary transition-all shadow-lg shadow-primary/20 hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <IoSend className="size-5 -translate-x-px translate-y-px" />
              </button>
            )}
          </div>
          <p className="text-center text-muted-foreground/50 text-[10px] mt-3 tracking-wide">
            Gbebody AI can make mistakes. Consult a professional for medical or dietary advice.
          </p>
        </div>
      </div>
    </div>
  );
}