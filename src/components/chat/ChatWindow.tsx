"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { IoSend, IoStop, IoClose } from "react-icons/io5";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { useSession, signIn } from "next-auth/react";
import { MicButton } from "@/components/chat/Mic";
import { useToast } from "@/hooks/useToast";
import { type ChatSession } from "./Category";

const MAX_CHARS = 1000;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const normalizeMessages = (msgs: any[]): Message[] =>
  msgs.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
  }));

interface ChatWindowProps {
  sessionId: string;
  category: "all" | "food" | "workouts" | "form";
  onNewChat: () => void;
  onSessionSaved: (session: ChatSession) => void;
}

export function ChatWindow({ sessionId, category, onNewChat, onSessionSaved }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [showSignInBanner, setShowSignInBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const titleSavedRef = useRef(false);
  const aiTitleFiredRef = useRef(false);

  const { data: session } = useSession();
  const { showError } = useToast();

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

  useEffect(() => {
    titleSavedRef.current = false;
    aiTitleFiredRef.current = false;
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        if (session) {
          const res = await fetch(`/api/chat?sessionId=${sessionId}`);
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(normalizeMessages(data.messages));
            titleSavedRef.current = true;
          } else {
            setMessages([getGreetingMessage(category)]);
          }
        } else {
          setMessages([getGreetingMessage(category)]);
        }
      } catch {
        showError("Failed to load chat. Please try again.");
        setMessages([getGreetingMessage(category)]);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [sessionId, session?.user?.id]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isLoading) return;

    const saveMessages = async () => {
      if (!session) return;
      try {
        const firstUserMessage = messages.find((m) => m.role === "user");
        const title = firstUserMessage?.content.slice(0, 60) ?? "New Chat";

        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, messages, category, title }),
        });

        if (!titleSavedRef.current && firstUserMessage) {
          titleSavedRef.current = true;
          onSessionSaved({
            sessionId,
            title,
            category,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      } catch {
        showError("Failed to save chat. Your latest messages might not be saved.");
      }
    };
    saveMessages();
  }, [messages, session, category, isLoading, sessionId]);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsTyping(false);
    setHasStartedReceiving(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || trimmed.length > MAX_CHARS) return;

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

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

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
              .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })),
          }),
        });

        if (!response.ok || !response.body) throw new Error(`API error: ${response.status}`);

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

      if (session && !aiTitleFiredRef.current) {
        aiTitleFiredRef.current = true;
        fetch("/api/chat/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, firstUserMessage: trimmed }),
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
          .catch(() => {
            // Title generation failure is non-critical, so we fail silently.
          });
      }
    },
    [isTyping, session, category, messages, sessionId, onSessionSaved]
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
        // Reset height to auto to allow shrinking on delete
        textareaRef.current.style.height = "auto";
        // Set height to the newly calculated scrollHeight
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  // Reset textarea height back to default when input is cleared
  useEffect(() => {
    if (input === "" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  const charsLeft = MAX_CHARS - input.length;
  const nearLimit = charsLeft <= 100;
  const atLimit = charsLeft === 0;
  const hasOnlyGreeting = messages.length === 1 && !isTyping;
  const canSend = input.trim().length > 0 && !isTyping && !atLimit;
  const showStopButton = isTyping && hasStartedReceiving;
  const showDisabledSendButton = isTyping && !hasStartedReceiving;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black min-h-dvh">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-muted-foreground animate-pulse text-sm">Initializing training protocol...</div>
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
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-4 py-8 space-y-4">
          {messages.map((msg) => {
            if (msg.role === "assistant" && msg.content === "" && isTyping) return null;
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
            
            {/* Elegant Textarea Pill */}
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