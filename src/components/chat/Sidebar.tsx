import { FaDumbbell, FaUtensils, FaWalking, FaComment, FaBolt, FaPlus, FaChevronLeft } from "react-icons/fa";
import { type CategoryType } from "./Category";

interface FitnessSidebarProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const categories: {id: CategoryType, label: string, icon: any}[] = [
  { id: "all", label: "All Topics", icon: FaComment },
  { id: "food", label: "Nutrition", icon: FaUtensils },
  { id: "workouts", label: "Workouts", icon: FaDumbbell },
  { id: "form", label: "Form & Technique", icon: FaWalking },
];

export function FitnessSidebar({ activeCategory, onCategoryChange, collapsed, onToggle }: FitnessSidebarProps) {
  return (
    <aside
      className={`h-screen flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-1 border-b border-border shrink-0">
        <div className="size-5 bg-naija-yellow rounded-full flex items-center justify-center text-xs border-2 border-naija-dark">
          🤖
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold leading-none text-gradient">Gbebody AI</h1>
            <p className="text-[10px] text-muted-foreground">Fitness Assistant</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <FaChevronLeft className={`size-3 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 py-3">
        <button
          onClick={() => onCategoryChange(activeCategory)}
          className={`w-full flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium transition-all hover:bg-primary/20 ${
            collapsed ? "h-10 justify-center px-0" : "h-10 px-3"
          }`}
        >
          <FaPlus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 px-2 space-y-1">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            Categories
          </p>
        )}
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full flex items-center gap-3 rounded-xl text-sm transition-all duration-200 ${
                collapsed ? "h-10 justify-center px-0" : "h-10 px-3"
              } ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
            >
              <cat.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{cat.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 shrink-0">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <FaBolt className="h-4 w-4 text-primary shrink-0" />
          {!collapsed && (
            <span className="text-xs text-muted-foreground">
              Powered by Gemini
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
