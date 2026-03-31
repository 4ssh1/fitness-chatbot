"use client";

import { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { ChatMessage } from "@/components/chat/Message";
import { TypingIndicator } from "@/components/chat/Indicator";
import { QuickPrompts } from "@/components/chat/QuickPrompts";
import { generateFitnessResponse } from "@/lib/ai";

function Textarea({ value, onChange, onKeyDown, placeholder, rows, inputRef }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows: number;
  inputRef: React.Ref<HTMLTextAreaElement>;
}) {
  return (
    <textarea
      ref={inputRef}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={rows}
      style={{
        flex: 1,
        minHeight: 48,
        maxHeight: 160,
        resize: "none",
        background: "var(--color-muted)",
        border: "1px solid ",
        borderRadius: 12,
        color: "var(--color-foreground)",
        fontSize: 14,
        padding: "12px 14px",
        outline: "none",
        fontFamily: "inherit",
        lineHeight: 1.5,
        transition: "border-color 0.15s",
        width: "100%",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
    />
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
      style={{
        width: 48,
        height: 48,
        flexShrink: 0,
        borderRadius: 12,
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s ease",
        boxShadow: disabled ? "none" : "0 0 16px rgba(99,102,241,0.4)",
        fontSize: 18,
      }}
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
      all:      "Hey! I'm **Gbebody AI** — your personal fitness assistant 🔥\n\nAsk me anything about **workouts**, **food & nutrition**, or **exercise form**. What's your goal today?",
      food:     "🥗 **Nutrition Mode** activated!\n\nI can help with meal plans, macros, calorie targets, pre/post workout nutrition, and healthy recipes. What are you working towards?",
      workouts: "💪 **Workout Mode** activated!\n\nI'll help you build programs, plan splits, track progressive overload, and choose the right exercises. What are we training today?",
      form:     "🎯 **Form & Technique Mode** activated!\n\nI'll guide you through proper movement patterns, cues to watch for, and how to avoid injury. Which exercise or movement do you want to nail?",
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
      <div className="border-t border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <Textarea
            inputRef={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about workouts, nutrition, technique…"
            rows={1}
          />
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
        <p className="text-center text-muted-foreground text-xs mt-2">
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