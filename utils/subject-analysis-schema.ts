import { z } from "zod";

export const SubjectInputSchema = z
  .string()
  .min(1, "Subject cannot be empty")
  .max(200, "Subject must be ≤ 200 characters");

export const SubjectAnalysisSchema = z.object({
  intent: z.enum(["marketing", "support", "personal", "spam", "unknown"]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  isSpam: z.boolean(),
  confidence: z.number().min(0).max(1),
});

export type SubjectAnalysis = z.infer<typeof SubjectAnalysisSchema>;
