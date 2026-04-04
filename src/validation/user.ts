import { z } from "zod"; 

export const ChatRequestSchema = z.object({
  userMessage: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message too long") 
    .trim(),
  category: z.enum(["all", "food", "workouts", "form"]).default("all"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(20) 
    .default([]),
  userGender: z.enum(["male", "female"]).optional(),
  sessionId: z.string().max(100).optional(),
});

