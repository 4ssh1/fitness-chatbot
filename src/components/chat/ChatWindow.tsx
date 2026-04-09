"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { IoSend, IoStop, IoClose } from "react-icons/io5";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { useSession, signIn } from "next-auth/react";
import { MicButton } from "@/components/chat/Mic";
import { useToast } from "@/hooks/useToast";
import { saveGuestSession, loadGuestSession } from "@/lib/indexedDB";
import { clearConversations } from "@/lib/indexedDB";

const MAX_CHARS = 1000;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const normalizeMessages = (msgs: any[]): Message[] => {
  return msgs.map((msg) => ({
    ...msg,
    timestamp:
      msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
  }));
};

export function ChatWindow({
  category,
  onNewChat,
}: {
  category: "all" | "food" | "workouts" | "form";
  onNewChat: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [showSignInBanner, setShowSignInBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { data: session } = useSession();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (session) return;

    const handleBeforeUnload = () => {
      sessionStorage.setItem("isReloading", "true");
    };

    const handleLoad = () => {
      if (sessionStorage.getItem("isReloading")) {
        sessionStorage.removeItem("isReloading");
      } else {
        // This case handles when the browser is closed and reopened
        clearConversations();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("load", handleLoad);

    // This handles the initial load of a new session
    if (!sessionStorage.getItem("isReloading")) {
      clearConversations();
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("load", handleLoad);
    };
  }, [session]);

  // ── Helper: get greeting message for a category ─────────────────────────
  const getGreetingMessage = (cat: string): Message => {
    const greetings: Record<string, string> = {
      all: "Hey! I'm **Gbebody AI**, your personal fitness assistant \n\n What's your goal today?",
      food: "**Nutrition Mode** activated!\n\nI can help with meal plans, macros, calorie targets, pre/post workout nutrition, and healthy recipes. What are you working towards?",
      workouts:
        "**Workout Mode** activated!\n\nI'll help you build programs, plan splits, track progressive overload, and choose the right exercises. What are we training today?",
      form: "**Form & Technique Mode** activated!\n\nI'll guide you through proper movement patterns, cues to watch for, and how to avoid injury. Which exercise or movement do you want to nail?",
    };
    return {
      id: "greeting",
      role: "assistant",
      content: greetings[cat] ?? greetings.all,
      timestamp: new Date(),
    };
  };

  // ── Load messages on mount / category change / session change ───────────
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        if (session) {
          const res = await fetch(`/api/chat?category=${category}`);
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(normalizeMessages(data.messages));
          } else {
            setMessages([getGreetingMessage(category)]);
          }
        } else {
          const saved = await loadGuestSession(category);
          if (saved && saved.length > 0) {
            setMessages(normalizeMessages(saved));
          } else {
            setMessages([getGreetingMessage(category)]);
          }
        }
      } catch (err) {
        showError("Failed to load chat. Please try again.");
        setMessages([getGreetingMessage(category)]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [category, session?.user?.id]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isLoading) return;

    const saveMessages = async () => {
      try {
        if (session) {
          await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, category }),
          });
        } else {
          await saveGuestSession(category, messages);
        }
      } catch (err) {
        showError("Failed to save chat. Your latest messages might not be saved.");
      }
    };
    saveMessages();
  }, [messages, session, category, isLoading]);

  // ── Stop streaming (called by UI button) ────────────────────────────────
  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsTyping(false);
    setHasStartedReceiving(false);
  }, []);

  // ── Send message with streaming ──────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;
      if (trimmed.length > MAX_CHARS) return;

      if (!session) setShowSignInBanner(true);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      setHasStartedReceiving(false);

      const assistantMsgId = `asst_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            userMessage: trimmed,
            category,
            history: messages
              .slice(1)
              .slice(-10)
              .map((m) => ({
                role: m.role,
                content: m.content.slice(0, 2000),
              })),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!hasStartedReceiving) setHasStartedReceiving(true);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          showError("Sorry, something went wrong. Please try again.");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: "Sorry, something went wrong. Please try again." }
                : m
            )
          );
        }
      } finally {
        abortControllerRef.current = null;
        setIsTyping(false);
        setHasStartedReceiving(false);
      }
    },
    [isTyping, session, category, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) setInput(val);
  };

  const charsLeft = MAX_CHARS - input.length;
  const nearLimit = charsLeft <= 100;
  const atLimit = charsLeft === 0;
  const hasOnlyGreeting = messages.length === 1 && !isTyping;
  const canSend = input.trim().length > 0 && !isTyping && !atLimit;

  const showStopButton = isTyping && hasStartedReceiving;
  const showDisabledSendButton = isTyping && !hasStartedReceiving;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-dvh w-full bg-black overflow-hidden">
      {/* Sign-in banner */}
      {!session && showSignInBanner && (
        <div className="absolute md:top-0 left-0 right-0 p-4 bg-gray-300 text-center text-naija-dark font-bold flex items-center justify-center z-10 bg-card/90 backdrop-blur-sm border-b border-border">
          <div className="flex items-center">
            <p className="text-sm text-foreground">Sign in to save your chat history.</p>
            <button
              onClick={() => signIn()}
              className="ml-4 bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded-full font-semibold hover:brightness-110 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignInBanner(false)}
              className="ml-2 text-muted-foreground hover:text-foreground transition"
              aria-label="Dismiss"
            >
              <IoClose className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-black relative min-h-0">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin px-4 py-6 space-y-2">
          {messages.map((msg) => {
            if (msg.role === "assistant" && msg.content === "" && isTyping) return null;
            return <ChatMessage key={msg.id} message={msg} />;
          })}
          {isTyping && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator category={category} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {hasOnlyGreeting && (
          <QuickPrompts category={category} onSelect={sendMessage} />
        )}

        {/* Input area */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm px-3 sm:px-4 py-3">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <div className="flex flex-1 flex-col rounded-xl border border-border bg-muted focus-within:border-primary transition-colors">
              <div className="flex items-end gap-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about workouts, nutrition, technique…"
                  rows={1}
                  disabled={isTyping}
                  className="flex-1 resize-none bg-transparent px-3 py-3 text-[11px] sm:text-sm text-foreground outline-none sm:max-h-40 placeholder:text-muted-foreground disabled:opacity-50"
                />
                <MicButton
                  onTranscript={(text) => setInput((prev) => prev + (prev ? " " : "") + text)}
                  disabled={isTyping}
                />
              </div>
              {nearLimit && (
                <p
                  className={`text-right text-[10px] px-3 pb-1.5 transition-colors ${atLimit ? "text-destructive font-semibold" : "text-muted-foreground"
                    }`}
                >
                  {atLimit ? "Character limit reached" : `${charsLeft} left`}
                </p>
              )}
            </div>

            {showStopButton ? (
              <button
                onClick={stopStream}
                className="shrink-0 flex items-center justify-center size-10 sm:size-11 mb-0.5 rounded-xl bg-destructive text-destructive-foreground border border-destructive/30 transition-colors hover:brightness-110"
                aria-label="Stop response"
              >
                <IoStop className="size-4" />
              </button>
            ) : showDisabledSendButton ? (
              <button
                disabled
                className="shrink-0 flex items-center justify-center size-10 sm:size-11 mb-0.5 rounded-xl bg-primary/50 text-primary-foreground border border-primary/30 cursor-not-allowed opacity-50"
                aria-label="Waiting for response"
              >
                <IoSend className="size-4" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                className="shrink-0 flex items-center justify-center size-10 sm:size-11 mb-0.5 rounded-xl bg-primary text-primary-foreground border border-primary/30 transition-colors hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <IoSend className="size-4" />
              </button>
            )}
          </div>
          <p className="text-center text-muted-foreground text-[9px] sm:text-xs mt-2">
            Gbebody AI can make mistakes. Consult a professional for medical or dietary advice.
          </p>
        </div>
      </div>
    </div>
  );
}