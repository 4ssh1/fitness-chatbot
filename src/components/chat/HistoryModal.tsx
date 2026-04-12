"use client";

import { useState, useMemo } from "react";
import { FaSearch, FaTimes, FaComment, FaUtensils, FaDumbbell, FaWalking } from "react-icons/fa";
import { CategoryType } from "./Category";

export interface ChatSession {
  sessionId: string;
  title: string;
  category: CategoryType;
  updatedAt: string;
  createdAt: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

// ── Date grouping helpers ─────────────────────────────────────────────────────
function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7DaysAgo = new Date(startOfToday);
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);
  const startOf30DaysAgo = new Date(startOfToday);
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOf7DaysAgo) return "Last 7 Days";
  if (date >= startOf30DaysAgo) return "Last 30 Days";
  return "Older";
}

const GROUP_ORDER = ["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Older"];

// ── Category badge config ─────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  all:      { label: "All Topics",      icon: FaComment,  color: "text-purple-400 bg-purple-400/10" },
  food:     { label: "Nutrition",       icon: FaUtensils, color: "text-green-400 bg-green-400/10"   },
  workouts: { label: "Workouts",        icon: FaDumbbell, color: "text-blue-400 bg-blue-400/10"     },
  form:     { label: "Form & Technique",icon: FaWalking,  color: "text-orange-400 bg-orange-400/10" },
};

export function HistoryModal({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
}: HistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    if (!searchTerm) return sessions;
    const lower = searchTerm.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(lower));
  }, [searchTerm, sessions]);

  // Group sessions by date label
  const grouped = useMemo(() => {
    const map: Record<string, ChatSession[]> = {};
    for (const s of filtered) {
      const group = getDateGroup(s.updatedAt);
      if (!map[group]) map[group] = [];
      map[group].push(s);
    }
    return map;
  }, [filtered]);

  if (!isOpen) return null;

  const presentGroups = GROUP_ORDER.filter((g) => grouped[g]?.length);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-black rounded-xl shadow-2xl border border-gray-800 w-full max-w-lg max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">Chat History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <FaTimes className="size-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-900">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-3.5" />
            <input
              type="text"
              placeholder="Search chats…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {presentGroups.length > 0 ? (
            presentGroups.map((group) => (
              <div key={group}>
                {/* Date group label */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-2 mb-1.5">
                  {group}
                </p>

                <div className="space-y-1">
                  {grouped[group].map((s) => {
                    const meta = CATEGORY_META[s.category] ?? CATEGORY_META.all;
                    const Icon = meta.icon;

                    return (
                      <div
                        key={s.sessionId}
                        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-900 transition-colors cursor-pointer"
                        onClick={() => onSelectSession(s)}
                      >
                        {/* Category icon */}
                        <span className={`shrink-0 flex items-center justify-center size-7 rounded-md text-[11px] ${meta.color}`}>
                          <Icon className="size-3.5" />
                        </span>

                        {/* Title + category label */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate leading-snug">{s.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{meta.label}</p>
                        </div>

                        {/* Delete button — visible on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.sessionId);
                          }}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-1 rounded"
                          aria-label="Delete chat"
                        >
                          <FaTimes className="size-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-12 text-sm">
              {searchTerm ? "No chats match your search." : "No chat history yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}