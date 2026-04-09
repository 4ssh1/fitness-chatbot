"use client";

import { useState, useMemo } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { type ChatMessage } from "@/types/chat";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: Record<string, ChatMessage[]>;
  onSelectHistory: (messages: ChatMessage[]) => void;
  onDeleteHistory: (category: string) => void;
}

export function HistoryModal({ isOpen, onClose, history, onSelectHistory, onDeleteHistory }: HistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const truncateToWords = (text: string, maxWords: number = 10): string => {
    const words = text.split(" ");
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(" ") + "…";
    }
    return text;
  };

  const getFirstUserMessage = (messages: ChatMessage[]): string | null => {
    const firstUserMsg = messages.find(msg => msg.role === "user");
    return firstUserMsg ? truncateToWords(firstUserMsg.content) : null;
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm) {
      return history;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered: Record<string, ChatMessage[]> = {};

    for (const category in history) {
      const messages = history[category];
      const hasMatch = messages.some(msg =>
        msg.content.toLowerCase().includes(lowercasedFilter)
      );
      if (hasMatch) {
        filtered[category] = messages;
      }
    }
    return filtered;
  }, [searchTerm, history]);

  if (!isOpen) return null;

  const historyCategories = Object.keys(filteredHistory);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-black rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Chat History</h2>
          <button onClick={onClose} className="text-gray-200 hover:text-white">
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-900">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {historyCategories.length > 0 ? (
            <div className="space-y-4">
              {historyCategories.map(category => (
                <div key={category} className="bg-gray-900 rounded-lg p-4">
                  <h3 className="font-bold text-white capitalize mb-2">{category}</h3>
                  <div className="space-y-2">
                    {getFirstUserMessage(filteredHistory[category]) && (
                      <div className="text-sm text-gray-300 line-clamp-2 hover:line-clamp-none cursor-pointer transition-all">
                        {getFirstUserMessage(filteredHistory[category])}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        onSelectHistory(history[category]);
                        onClose();
                      }}
                      className="text-sm text-black hover:opacity-80 bg-white font-bold py-1 px-3 rounded"
                    >
                      Load Chat
                    </button>
                    <button
                      onClick={() => onDeleteHistory(category)}
                      className="text-sm bg-red-700 hover:bg-red-800 text-white font-bold py-1 px-3 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No history recorded.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
