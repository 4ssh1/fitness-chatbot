"use client";

import { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { generateFitnessResponse } from "@/lib/ai";
import { FaMicrophone } from "react-icons/fa";

function Textarea({ value, onChange, onKeyDown, placeholder, rows, inputRef }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows: number;
  inputRef: React.Ref<HTMLTextAreaElement>;
}) {
  return (
    <div className="relative flex-1">
      <textarea
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 md:max-h-40 w-full resize-none rounded-xl border bg-muted p-3 pr-10 text-[9px] sm:text-sm text-foreground outline-none transition-colors focus:border-primary"
        rows={rows}
      />
      <button className="absolute right-3 top-4 md:top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        <FaMicrophone />
      </button>
    </div>
  );
}

function IconButton({ onClick, disabled, children }: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="sm:size-12 size-10 shrink-0 rounded-xl bg-primary text-primary-foreground border border-primary/30 hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center transition-colors"
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = "brightness(1.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "none";
      }}
    >
      {children}
    </button>
  );
}

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

    setMessages([
      {
        id: "greeting",
        role: "assistant",
        content: greetings[category] ?? greetings.all,
        timestamp: new Date(),
      },
    ]) ;
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

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
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
      <div className="border-t border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1">
            <Textarea
              inputRef={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about workouts, nutrition, technique…"
              rows={1}
            />
          </div>
          <IconButton
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
          >
            {isTyping ? (
              <AiOutlineLoading3Quarters
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            ) : (
              <IoSend />
            )}
          </IconButton>
        </div>
        <p className="text-center text-muted-foreground text-[9px] sm:text-xs mt-4 sm:mt-2">
          Gbebody AI can make mistakes. Consult a professional for medical or dietary advice.
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}