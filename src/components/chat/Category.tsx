"use client";

import { useState } from "react";
import { FaBars } from "react-icons/fa";
import { FitnessSidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";

export type CategoryType = "all" | "food" | "workouts" | "form";

const Category = () => {
  const [category, setCategory] = useState<CategoryType>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleCategoryChange = (cat: CategoryType) => {
    setCategory(cat);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
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
          activeCategory={category}
          onCategoryChange={handleCategoryChange}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
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

        <ChatWindow category={category} />
      </main>
    </div>
  );
};

export default Category;