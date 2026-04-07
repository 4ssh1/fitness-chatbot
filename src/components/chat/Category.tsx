"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FaBars } from "react-icons/fa";
import { FitnessSidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { HistoryModal } from "./HistoryModal";
import { type ChatMessage } from "@/types/chat";

export type CategoryType = "all" | "food" | "workouts" | "form";

const Category = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Record<string, ChatMessage[]>>({});
  const [conversationId, setConversationId] = useState(Date.now());
  const { data: session } = useSession();

  useEffect(() => {
    const savedCategory = sessionStorage.getItem("activeCategory") as CategoryType;
    if (savedCategory) {
      setActiveCategory(savedCategory);
    }

    if (session) {
      fetch("/api/chat")
        .then((res) => res.json())
        .then((data) => {
          if (data.history) {
            setHistory(data.history);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const handleCategoryChange = (cat: CategoryType) => {
    setActiveCategory(cat);
    sessionStorage.setItem("activeCategory", cat);
    setMobileSidebarOpen(false);
  };

  const handleNewChat = () => {
    setMobileSidebarOpen(false);
  };

  const handleHistory = () => {
    setIsHistoryOpen(true);
    setMobileSidebarOpen(false);
  };

  const handleSelectHistory = (selectedMessages: ChatMessage[]) => {
    const categoryOfHistory = Object.keys(history).find(key => history[key] === selectedMessages);
    if (categoryOfHistory) {
      setActiveCategory(categoryOfHistory as CategoryType);
    }
    setConversationId(Date.now());
    setIsHistoryOpen(false);
  };

  const handleDeleteHistory = async (categoryToDelete: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/chat?category=${categoryToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Optimistically update UI
        const newHistory = { ...history };
        delete newHistory[categoryToDelete];
        setHistory(newHistory);
      } else {
        console.error("Failed to delete history");
      }
    } catch (error) {
      console.error("Error deleting history:", error);
    }
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
          key={conversationId}
          category={activeCategory}
          onNewChat={handleNewChat}
        />
      </main>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
      />
    </div>
  );
};

export default Category;