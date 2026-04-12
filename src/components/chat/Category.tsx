"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FaBars } from "react-icons/fa";
import { FitnessSidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { HistoryModal } from "./HistoryModal";
import { clearConversations } from "@/lib/indexedDB";

export type CategoryType = "all" | "food" | "workouts" | "form";

export interface ChatSession {
  sessionId: string;
  title: string;
  category: CategoryType;
  updatedAt: string;
  createdAt: string;
}

const Category = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  // Each new chat gets a fresh sessionId; loading a history item reuses its id
  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => crypto.randomUUID()
  );
  const { data: session } = useSession();

  // ── Restore last-used category from sessionStorage ───────────────────────
  useEffect(() => {
    const savedCategory = sessionStorage.getItem("activeCategory") as CategoryType;
    if (savedCategory) setActiveCategory(savedCategory);
  }, []);

  // ── Fetch session list when the user is authenticated ────────────────────
  const fetchSessions = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  }, [session]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // ── Category change ───────────────────────────────────────────────────────
  const handleCategoryChange = (cat: CategoryType) => {
    setActiveCategory(cat);
    sessionStorage.setItem("activeCategory", cat);
    setMobileSidebarOpen(false);
  };

  // ── New chat: generate a fresh session id ────────────────────────────────
  const handleNewChat = async () => {
    if (!session) {
      try {
        await clearConversations(activeCategory);
      } catch (err) {
        console.error("Failed to clear guest session:", err);
      }
    }
    setActiveSessionId(crypto.randomUUID());
    setMobileSidebarOpen(false);
  };

  // ── Open history modal (refresh list first) ──────────────────────────────
  const handleHistory = () => {
    fetchSessions();
    setIsHistoryOpen(true);
    setMobileSidebarOpen(false);
  };

  // ── Load a session from history ──────────────────────────────────────────
  const handleSelectHistory = (selectedSession: ChatSession) => {
    setActiveCategory(selectedSession.category);
    sessionStorage.setItem("activeCategory", selectedSession.category);
    setActiveSessionId(selectedSession.sessionId);
    setIsHistoryOpen(false);
  };

  // ── Delete a session ─────────────────────────────────────────────────────
  const handleDeleteSession = async (sessionId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      } else {
        console.error("Failed to delete session");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  // ── Called by ChatWindow when a new session title is derived ─────────────
  const handleSessionSaved = (savedSession: ChatSession) => {
    setSessions((prev) => {
      const exists = prev.find((s) => s.sessionId === savedSession.sessionId);
      if (exists) {
        return prev.map((s) =>
          s.sessionId === savedSession.sessionId ? { ...s, ...savedSession } : s
        );
      }
      return [savedSession, ...prev];
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      {/* Overlay for mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <FitnessSidebar
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          onNewChat={handleNewChat}
          onOpenHistory={handleHistory}
          collapsed={isSidebarOpen}
          onToggle={() => setSidebarOpen(!isSidebarOpen)}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header */}
        <div className="h-14 flex items-center px-3 border-b border-border shrink-0 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
          >
            <FaBars className="h-5 w-5" />
          </button>
          <h1 className="ml-2 font-display text-lg font-bold text-gradient">
            Gbebody AI
          </h1>
        </div>

        <ChatWindow
          key={activeSessionId}
          sessionId={activeSessionId}
          category={activeCategory}
          onNewChat={handleNewChat}
          onSessionSaved={handleSessionSaved}
        />
      </main>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        onSelectSession={handleSelectHistory}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
};

export default Category;