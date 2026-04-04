export function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="size-5 bg-naija-yellow rounded-full flex items-center justify-center text-xl border-2 border-naija-dark">
        🤖
      </div>
      <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center h-[38px]">
        <span className="h-2 w-2 rounded-full bg-naija-purple animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-naija-purple animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-naija-purple animate-bounce" />
      </div>
    </div>
  );
}