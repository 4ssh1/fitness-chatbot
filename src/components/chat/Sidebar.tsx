import { FaDumbbell, FaUtensils, FaWalking, FaComment, FaBolt, FaPlus, FaChevronLeft, FaTimes } from "react-icons/fa";
import { type CategoryType } from "./Category";
import { useSession, signIn, signOut } from 'next-auth/react';

interface FitnessSidebarProps {
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  onNewChat: () => void;
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

const categories: { id: CategoryType; label: string; icon: any }[] = [
  { id: "all",      label: "All Topics",      icon: FaComment  },
  { id: "food",     label: "Nutrition",        icon: FaUtensils },
  { id: "workouts", label: "Workouts",         icon: FaDumbbell },
  { id: "form",     label: "Form & Technique", icon: FaWalking  },
];

export function FitnessSidebar({
  activeCategory,
  onCategoryChange,
  onNewChat,
  collapsed,
  onToggle,
  onMobileClose,
}: FitnessSidebarProps) {
  const { data: session } = useSession()
  // On mobile: never collapsed. On desktop: respect the prop.
  const isCollapsed = collapsed; // only visually applied at lg via classes

  return (
    <aside
      className={`h-screen flex flex-col border-r border-border bg-black transition-all duration-300 shrink-0 w-64 ${
        isCollapsed ? "md:w-12" : "md:w-64"
      }`}
    >
      {/* Header */}
      <div className={`h-14 flex items-center border-b border-border shrink-0 ${
        isCollapsed ? "md:justify-center px-3 md:px-0" : "px-3"
      }`}>
        
        {/* Title: always show on mobile, hide on desktop when collapsed */}
        <div className={`flex-1 min-w-0 ${isCollapsed ? "md:hidden" : ""}`}>
          <h1 className="font-display text-lg font-bold leading-none text-gradient">Gbebody AI</h1>
          <p className="text-[10px] text-muted-foreground">Fitness Assistant</p>
        </div>

        {/* X — mobile only */}
        <button
          onClick={onMobileClose}
          className="md:hidden h-7 w-7 shrink-0 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close sidebar"
        >
          <FaTimes className="size-3.5" />
        </button>

        {/* Chevron — desktop only */}
        <button
          onClick={onToggle}
          className="hidden md:flex h-7 w-7 shrink-0 rounded-md items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          <FaChevronLeft className={`size-3 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* New chat */}
      <div className={`py-3 ${isCollapsed ? "px-3 md:px-1.5" : "px-3"}`}>
        <button
          onClick={onNewChat}
          className={`flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium transition-all hover:bg-primary/20 h-9 ${
            isCollapsed
              ? "w-full px-3 md:w-9 md:justify-center md:px-0"
              : "w-full px-3"
          }`}
        >
          <FaPlus className="h-3.5 w-3.5 shrink-0" />
          <span className={isCollapsed ? "md:hidden" : ""}>New Chat</span>
        </button>
      </div>

      {/* Categories */}
      <div className={`flex-1 space-y-1 ${isCollapsed ? "px-2 md:px-1.5" : "px-2"}`}>
        <p className={`px-2 mb-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground ${
          isCollapsed ? "md:hidden" : ""
        }`}>
          Categories
        </p>
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-3 rounded-xl text-sm transition-all duration-200 h-9 ${
                isCollapsed
                  ? "w-full px-3 md:w-9 md:justify-center md:px-0"
                  : "w-full px-3"
              } ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent"
              }`}
            >
              <cat.icon className="h-4 w-4 shrink-0" />
              <span className={isCollapsed ? "md:hidden" : ""}>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`py-3 shrink-0 ${isCollapsed ? "px-3 md:px-0 md:flex md:justify-center" : "px-3"}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs text-muted-foreground ${isCollapsed ? "md:hidden" : ""}`}>
            Powered by Gemini
          </span>
        </div>
      </div>
      <div className="mt-auto p-3 border-t border-border">
        {session ? (
          <div className="flex items-center gap-2">
            <img
              src={session.user?.image || ''}
              alt={session.user?.name || ''}
              className="w-8 h-8 rounded-full"
              rel="noreferrer"
            />
            <div className={`flex-1 min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
              <p className="text-sm font-medium truncate text-white">
                {session.user?.name}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs text-muted-foreground hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className={`w-full text-white font-bold py-2 px-4 rounded-full ${
              isCollapsed ? 'md:hidden' : ''
            }`}
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}