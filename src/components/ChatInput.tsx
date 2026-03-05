"use client";

import Button from "./Button";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (gender?: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, disabled }: Props) {
  return (
    <form
      className="flex flex-col gap-2 mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <textarea
        className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        rows={3}
        placeholder="Type your question for GbeBody Coach..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">
          Tip: Mention if you're male or female for better advice.
        </span>
        <Button type="submit" disabled={disabled}>
          {disabled ? "Thinking..." : "Send"}
        </Button>
      </div>
    </form>
  );
}
