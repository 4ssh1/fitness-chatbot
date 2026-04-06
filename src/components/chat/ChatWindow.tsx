"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { IoSend, IoStop, IoClose } from "react-icons/io5";
import { FaMicrophone } from "react-icons/fa";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { useSession, signIn } from "next-auth/react";

const MAX_CHARS = 1000;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatWindow({
  category,
}: {
  category: "all" | "food" | "workouts" | "form";
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSignInBanner, setShowSignInBanner] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Holds the AbortController for the active stream so we can cancel it
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: session } = useSession();

  // ── Greeting on category change ──────────────────────────────────────────
  useEffect(() => {
    const greetings: Record<string, string> = {
      all: "Hey! I'm **Gbebody AI**, your personal fitness assistant \n\n What's your goal today?",
      food: "**Nutrition Mode** activated!\n\nI can help with meal plans, macros, calorie targets, pre/post workout nutrition, and healthy recipes. What are you working towards?",
      workouts:
        "**Workout Mode** activated!\n\nI'll help you build programs, plan splits, track progressive overload, and choose the right exercises. What are we training today?",
      form: "**Form & Technique Mode** activated!\n\nI'll guide you through proper movement patterns, cues to watch for, and how to avoid injury. Which exercise or movement do you want to nail?",
    };
    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: greetings[category] ?? greetings.all,
        timestamp: new Date(),
      },
    ]);
  }, [category]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Stop streaming ────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsTyping(false);
  }, []);

  // ── Send / stream message ─────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;
      if (trimmed.length > MAX_CHARS) return; // hard guard (UI already warns)

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

      // Placeholder assistant bubble we stream into
      const assistantMsgId = `asst_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      // Create a fresh AbortController for this request
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
              .slice(1) // Exclude initial greeting
              .slice(-10) // Only send the last 10 messages
              .map((m) => ({ 
                role: m.role, 
                // Truncate content to match validation schema
                content: m.content.slice(0, 2000) 
              })),
          }),
        });

        if (!response.ok || !response.body) {
          let errMsg = "Unknown error";
          try {
            const err = await response.json();
            errMsg = JSON.stringify(err);
          } catch {
            errMsg = await response.text();
          }
          console.error("API route error:", {
            status: response.status,
            statusText: response.statusText,
            message: errMsg,
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: "Sorry, something went wrong. Please try again." }
                : m
            )
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
        }
      } catch (err: any) {
        // AbortError means the user clicked Stop — not a real error
        if (err?.name !== "AbortError") {
          console.error("Streaming error:", err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: "Sorry, something went wrong. Please try again." }
                : m
            )
          );
        }
        // If aborted, keep whatever partial content was already streamed in
      } finally {
        abortControllerRef.current = null;
        setIsTyping(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Allow typing but cap at MAX_CHARS (slice prevents paste overflow)
    if (val.length <= MAX_CHARS) setInput(val);
  };

  const charsLeft = MAX_CHARS - input.length;
  const nearLimit = charsLeft <= 100;
  const atLimit = charsLeft === 0;
  const hasOnlyGreeting = messages.length === 1;
  const canSend = input.trim().length > 0 && !isTyping && !atLimit;

  return (
    <div className="flex flex-col h-full">
      {/* ── Sign-in banner ─────────────────────────────────────────────── */}
      {!session && showSignInBanner && (
        <div className="absolute top-0 left-0 right-0 p-4 text-center text-naija-dark font-bold flex items-center justify-center z-10 bg-card/90 backdrop-blur-sm border-b border-border">
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
      )}

      <div className="flex-1 flex flex-col bg-black relative">
        {/* ── Messages ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-2">
          {messages.map((msg) => {
            // Hide the empty placeholder while the typing indicator is showing
            if (msg.role === "assistant" && msg.content === "" && isTyping)
              return null;
            return <ChatMessage key={msg.id} message={msg} />;
          })}

          {isTyping && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator category={category} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick prompts (fresh chat only) ────────────────────────────── */}
        {hasOnlyGreeting && !isTyping && (
          <QuickPrompts category={category} onSelect={sendMessage} />
        )}

        {/* ── Input area ─────────────────────────────────────────────────── */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm px-3 sm:px-4 py-3">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            {/* Textarea + mic pill */}
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
                  className="flex-1 resize-none bg-transparent px-3 py-3 text-[9px] sm:text-sm text-foreground outline-none sm:max-h-40 placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={isTyping}
                  className="shrink-0 flex items-center justify-center w-9 h-9 mb-1.5 mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                  aria-label="Voice input"
                >
                  <FaMicrophone className="size-3.5 sm:size-4" />
                </button>
              </div>

              {/* Character counter — only appears when within 100 chars of limit */}
              {nearLimit && (
                <p
                  className={`text-right text-[10px] px-3 pb-1.5 transition-colors ${
                    atLimit ? "text-destructive font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {atLimit ? "Character limit reached" : `${charsLeft} left`}
                </p>
              )}
            </div>

            {/* Send / Stop button */}
            {isTyping ? (
              <button
                onClick={stopStream}
                className="shrink-0 flex items-center justify-center size-10 sm:size-11 mb-0.5 rounded-xl bg-destructive text-destructive-foreground border border-destructive/30 transition-colors hover:brightness-110"
                aria-label="Stop response"
                title="Stop response"
              >
                <IoStop className="size-4" />
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