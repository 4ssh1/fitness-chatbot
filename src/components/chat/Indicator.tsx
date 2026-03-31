export function TypingIndicator() {
  return (
    <div className="msg-animate flex gap-3 items-end">
      <div className="size-5 bg-naija-yellow rounded-full flex items-center justify-center text-xl border-2 border-naija-dark">
              🤖
            </div>
      <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        <span className="h-2 w-2 rounded-full bg-primary dot-1" />
        <span className="h-2 w-2 rounded-full bg-primary dot-2" />
        <span className="h-2 w-2 rounded-full bg-primary dot-3" />
      </div>
    </div>
  );
}
