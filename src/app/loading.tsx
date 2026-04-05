export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}