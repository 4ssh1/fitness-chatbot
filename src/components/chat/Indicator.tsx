"use client";

import { useEffect, useState } from "react";

const TIPS: Record<string, string[]> = {
  all: [
    "Compound lifts like squats and deadlifts burn more calories than isolation moves.",
    "Eating protein within 30 mins after training helps muscle recovery.",
    "Rest days are when your muscles actually grow, don't skip them.",
    "Progressive overload means adding just a little more weight each week.",
    "Beans and eggs are two of the cheapest high-protein foods available.",
  ],
  food: [
    "Ofada rice has a lower glycemic index than regular white rice.",
    "Titus fish is one of the cheapest high-omega-3 protein sources in Nigeria.",
    "Eating every 3-4 hours helps keep your metabolism active.",
    "Unripe plantain is a great slow-digesting carb before a workout.",
    "Groundnut is calorie-dense, great for bulking, go easy when cutting.",
  ],
  workouts: [
    "A Push/Pull/Legs split hits each muscle group twice a week optimally.",
    "You can build real muscle with just bodyweight if you add progressive difficulty.",
    "NEPA cut your power? Bodyweight circuits are just as effective.",
    "Warming up for 5 mins reduces injury risk significantly.",
    "Your weakest lift usually has the most room for growth — prioritise it.",
  ],
  form: [
    "Bracing your core before every rep protects your lower back.",
    "Knees should track over your toes, not caving inward on squats.",
    "On deadlifts, push the floor away rather than pulling the bar up.",
    "A neutral spine, not a flat back, is what you're aiming for on hinges.",
    "Record yourself from the side, you'll spot form issues instantly.",
  ],
};

export function TypingIndicator({ category = "all" }: { category?: string }) {
  const tips = TIPS[category] ?? TIPS.all;
  const [index, setIndex] = useState(() => Math.floor(Math.random() * tips.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % tips.length);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-3 items-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="size-7 bg-naija-purple rounded-full flex items-center justify-center text-sm border-2 border-border shrink-0">
          🤖
        </div>
        <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center h-[38px]">
          <span className="h-2 w-2 rounded-full bg-naija-purple dot-1" />
          <span className="h-2 w-2 rounded-full bg-naija-purple dot-2" />
          <span className="h-2 w-2 rounded-full bg-naija-purple dot-3" />
        </div>
      </div>

      <p
        className="text-[11px] text-muted-foreground ml-10 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="text-primary/70 font-medium">Tip:</span>{" "}
        {tips[index]}
      </p>
    </div>
  );
}