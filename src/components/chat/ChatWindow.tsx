"use client";

import { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaMicrophone } from "react-icons/fa";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { useSession, signIn } from 'next-auth/react';
import { IoClose } from 'react-icons/io5';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatWindow({ category }: { category: "all" | "food" | "workouts" | "form" }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();
  const [showSignInBanner, setShowSignInBanner] = useState(false);

  useEffect(() => {
    const greetings = {
      all: "Hey! I'm **Gbebody AI**, your personal fitness assistant \n\n What's your goal today?",
      food: "**Nutrition Mode** activated!\n\nI can help with meal plans, macros, calorie targets, pre/post workout nutrition, and healthy recipes. What are you working towards?",
      workouts: "**Workout Mode** activated!\n\nI'll help you build programs, plan splits, track progressive overload, and choose the right exercises. What are we training today?",
      form: "**Form & Technique Mode** activated!\n\nI'll guide you through proper movement patterns, cues to watch for, and how to avoid injury. Which exercise or movement do you want to nail?",
    };

    setMessages([{
      id: "greeting",
      role: "assistant",
      content: greetings[category] ?? greetings.all,
      timestamp: new Date(),
    }]);
  }, [category]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    if (!session) {
      setShowSignInBanner(true);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Placeholder assistant message that we'll stream into
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: text.trim(),
          category,
          history: messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}));
        console.error("API route error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m
          )
        );
        setIsTyping(false);
        return;
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Append chunk to the assistant message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasOnlyGreeting = messages.length === 1;

  return (
    <div className="flex flex-col h-full">
      {!session && showSignInBanner && (
        <div className="absolute top-0 left-0 right-0 bg-naija-yellow p-4 text-center text-naija-dark font-bold flex items-center justify-center z-10">
          <p>Sign in to save your chat history.</p>
          <button
            onClick={() => signIn()}
            className="ml-4 bg-naija-magenta text-white px-4 py-2 rounded-full"
          >
            Sign In
          </button>
          <button
            onClick={() => setShowSignInBanner(false)}
            className="ml-2 text-2xl"
          >
            <IoClose />
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col bg-naija-light relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-2">
          {messages.map((msg) => {
            if (msg.role === "assistant" && msg.content === "" && isTyping) {
              return null;
            }
            return <ChatMessage key={msg.id} message={msg} />;
          })}

          {isTyping && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator category={category} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts — only on fresh chat */}
        {hasOnlyGreeting && !isTyping && (
          <QuickPrompts category={category} onSelect={sendMessage} />
        )}

        {/* Input area */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm px-3 sm:px-4 py-3">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">

            {/* Textarea + mic in one pill */}
            <div className="flex flex-1 items-end gap-1 rounded-xl border border-border bg-muted focus-within:border-primary transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about workouts, nutrition, technique…"
                rows={1}
                className="flex-1 resize-none bg-transparent px-3 py-3 text-[9px] sm:text-sm text-foreground outline-none sm:max-h-40 placeholder:text-muted-foreground"
              />
              <button
                type="button"
                className="shrink-0 flex items-center justify-center w-9 h-9 mb-1.5 mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Voice input"
              >
                <FaMicrophone className="size-3.5 sm:size-4" />
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="shrink-0 flex items-center justify-center size-10 sm:size-11 mb-0.5 rounded-xl bg-primary text-primary-foreground border border-primary/30 transition-colors hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isTyping ? (
                <AiOutlineLoading3Quarters className="size-4 animate-spin" />
              ) : (
                <IoSend className="size-4" />
              )}
            </button>
          </div>

          <p className="text-center text-muted-foreground text-[9px] sm:text-xs mt-2">
            Gbebody AI can make mistakes. Consult a professional for medical or dietary advice.
          </p>
        </div>
      </div>
    </div>
  );
}