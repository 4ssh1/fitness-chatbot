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
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">Chat History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
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
                <div key={category} className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="font-bold text-white capitalize mb-2">{category}</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-thin">
                    {filteredHistory[category].slice(0, 5).map(msg => (
                       <div key={msg.id} className="text-sm text-gray-300 truncate">
                         <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>
                         {msg.content}
                       </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        onSelectHistory(history[category]);
                        onClose();
                      }}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                    >
                      Load Chat
                    </button>
                    <button
                      onClick={() => onDeleteHistory(category)}
                      className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
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
