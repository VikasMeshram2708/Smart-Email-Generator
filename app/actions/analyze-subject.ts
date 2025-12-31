"use server";

import {
  SubjectAnalysis,
  SubjectAnalysisSchema,
  SubjectInputSchema,
} from "@/utils/subject-analysis-schema";
import { groq } from "./groq-client";

export async function analyzeSubjectAction(
  rawSubject: string
): Promise<SubjectAnalysis> {
  // sanitize the input
  const subject = SubjectInputSchema.parse(rawSubject);

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `
You are an email subject analyzer.
You must return ONLY valid JSON matching this shape:

{
  "intent": "marketing | support | personal | spam | unknown",
  "sentiment": "positive | neutral | negative",
  "isSpam": boolean,
  "confidence": number (0 to 1)
}

No markdown. No explanation.
`,
        },
        {
          role: "user",
          content: subject,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("LLM returned empty response");
    }

    // Runtime validation of LLM output
    const parsed = JSON.parse(content);
    return SubjectAnalysisSchema.parse(parsed);
  } catch (error) {
    console.error("[analyzeSubjectAction]", error);
    throw new Error("Failed to analyze email subject");
  }
}
