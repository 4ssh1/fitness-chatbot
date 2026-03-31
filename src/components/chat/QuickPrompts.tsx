const PROMPTS: Record<string, { label: string; prompt: string }[]> = {
  all: [
    { label: "Build a workout plan", prompt: "Create a 4-day workout plan for building muscle as a beginner." },
    { label: "Meal prep ideas", prompt: "Give me a high-protein meal prep plan for the week under 2000 calories." },
    { label: "Squat form tips", prompt: "What are the most important cues for a perfect squat?" },
    { label: "Fat loss tips", prompt: "What's the most effective approach to losing body fat while keeping muscle?" },
  ],
  food: [
    { label: "High-protein breakfast", prompt: "Give me 5 high-protein breakfast ideas that take under 10 minutes." },
    { label: "Calculate my macros", prompt: "How do I calculate my macros for muscle building? I weigh 180lbs." },
    { label: "Pre-workout meal", prompt: "What should I eat 1-2 hours before a heavy lifting session?" },
    { label: "Healthy snacks", prompt: "What are the best healthy snacks for late-night cravings?" },
  ],
  workouts: [
    { label: "Push/Pull/Legs split", prompt: "Design a Push/Pull/Legs 6-day split for intermediate lifters." },
    { label: "Cardio for fat loss", prompt: "What's the best cardio strategy for fat loss without losing muscle?" },
    { label: "Progressive overload", prompt: "Explain progressive overload and how to implement it week over week." },
    { label: "Home workout", prompt: "Give me an effective full-body home workout with no equipment." },
  ],
  form: [
    { label: "Deadlift setup", prompt: "Walk me through the perfect deadlift setup step by step." },
    { label: "Bench press cues", prompt: "What are the key form cues for a safe and strong bench press?" },
    { label: "Hip hinge basics", prompt: "How do I learn and practice the hip hinge movement pattern?" },
    { label: "Common mistakes", prompt: "What are the most common form mistakes beginners make in the gym?" },
  ],
};

interface QuickPromptsProps {
  category: string;
  onSelect: (prompt: string) => void;
}

export function QuickPrompts({ category, onSelect }: QuickPromptsProps) {
  const prompts = PROMPTS[category] ?? PROMPTS.all;

  return (
    <div className="px-4 pb-3">
      <p className="text-xs text-muted-foreground mb-2 text-center font-display uppercase tracking-widest">
        Quick starts
      </p>
      <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
        {prompts.map((p) => (
          <button
            key={p.prompt}
            onClick={() => onSelect(p.prompt)}
            className="text-left text-xs sm:text-sm bg-muted hover:bg-secondary border border-border hover:border-primary/50 text-foreground rounded-xl px-3 py-2 transition-all duration-200 hover:text-primary leading-snug"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
