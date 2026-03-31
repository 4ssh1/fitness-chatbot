"use client";

import { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaMicrophone } from "react-icons/fa";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { generateFitnessResponse } from "@/lib/ai";

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

  useEffect(() => {
    const greetings = {
      all:      "Hey! I'm **Gbebody AI**, your personal fitness assistant 🔥\n\n What's your goal today?",
      food:     "**Nutrition Mode** activated!\n\nI can help with meal plans, macros, calorie targets, pre/post workout nutrition, and healthy recipes. What are you working towards?",
      workouts: "**Workout Mode** activated!\n\nI'll help you build programs, plan splits, track progressive overload, and choose the right exercises. What are we training today?",
      form:     "**Form & Technique Mode** activated!\n\nI'll guide you through proper movement patterns, cues to watch for, and how to avoid injury. Which exercise or movement do you want to nail?",
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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const responseText = await generateFitnessResponse(text.trim(), category);
    setIsTyping(false);

    setMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseText,
      timestamp: new Date(),
    }]);
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
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
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
            {/* Mic button — sits at the bottom of the pill, aligned with send */}
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
  );
}