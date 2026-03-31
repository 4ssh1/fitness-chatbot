import { HistoryItem } from "@/types/chat";
import { User } from "@/generated/client";
import { buildContextPrompt, buildMessages } from "./helpers";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function detectCategory(text: string): string {
  if (/(food|eat|meal|protein|calorie|macro|nutrition|diet|carb|fat|cook|recipe)/i.test(text))
    return "food";
  if (/(workout|exercise|training|lift|gym|cardio|split|program|rep|set|push|pull)/i.test(text))
    return "workouts";
  if (/(form|technique|cue|squat|deadlift|bench|posture|movement|hinge|mistake)/i.test(text))
    return "form";
  return "all";
}

export async function generateFitnessResponse(
  userMessage: string,
  category: string,
  history: HistoryItem[] = [],
  user?: User | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return "I'm having trouble connecting right now. Please try again shortly.";
  }

  const detectedCategory = category === "all" ? detectCategory(userMessage) : category;

  // Inject category context into the prompt when relevant
  const categoryHint =
    detectedCategory !== "all"
      ? `\n\nThe user is currently in ${detectedCategory.toUpperCase()} mode — prioritise responses related to ${detectedCategory}.`
      : "";

  const contextPrompt = buildContextPrompt(user) + categoryHint;
  const messages = buildMessages(contextPrompt, history, userMessage);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Gemini API error:", err);
      return "Something went wrong on my end. Try again in a moment!";
    }

    const data = await response.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return "I didn't get a response. Please rephrase and try again.";
    }

    return text.trim();
  } catch (error) {
    console.error("Network error calling Gemini:", error);
    return "Network issue — check your connection and try again.";
  }
}