"use server";
import { SubjectAnalysis } from "@/utils/subject-analysis-schema";
import { groq } from "./groq-client";

export async function generateMailFromAnalysis(
  analysis: SubjectAnalysis,
  subject: string
): Promise<string> {
  const { confidence, intent, isSpam, sentiment } = analysis;

  // Input validation
  if (!subject.trim()) {
    throw new Error("Subject cannot be empty");
  }

  // Create a prompt for the AI
  const prompt = `You are a professional email writing assistant. Generate a professional email based on this analysis:

ORIGINAL SUBJECT: ${subject}
INTENT: ${intent}
SENTIMENT: ${sentiment}
CONFIDENCE LEVEL: ${Math.round(confidence * 100)}%
SPAM INDICATOR: ${isSpam ? "Potential spam detected" : "Not spam"}

INSTRUCTIONS:
1. Write an email that appropriately addresses the detected intent (${intent})
2. Match the tone to the sentiment (${sentiment})
3. Include a relevant subject line (start with "Subject: ")
4. Use professional email structure
5. Keep it concise but complete
6. ${isSpam ? "Be cautious - this may be spam" : "Proceed normally"}

Generate only the email content:`;

  try {
    const res = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are an expert email writer. Generate professional, appropriate emails.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 1024,
    });

    const result = res.choices[0]?.message?.content?.trim();

    if (!result) {
      console.warn("[generateMailFromAnalysis] Empty response from AI");
      return generateFallbackEmail(analysis, subject);
    }

    // console.log(
    //   "[generateMailFromAnalysis] Success:",
    //   result.substring(0, 100) + "..."
    // );

    return result;
  } catch (error) {
    console.error("[generateMailFromAnalysis] AI Generation Failed:", error);

    // Fallback to template-based generation
    return generateFallbackEmail(analysis, subject);
  }
}

// Fallback function in case AI fails
function generateFallbackEmail(
  analysis: SubjectAnalysis,
  subject: string
): string {
  const { intent, sentiment, isSpam } = analysis;

  const subjectPrefix = isSpam ? "[Review Needed] " : "";

  let greeting = "Hello,";
  let body = "";
  let closing = "Best regards,";

  // Adjust based on sentiment
  switch (sentiment.toLowerCase()) {
    case "positive":
      greeting = "Hello,";
      body = `Thank you for your ${intent.toLowerCase()} regarding "${subject}".\n\n`;
      closing = "Warm regards,";
      break;
    case "negative":
      greeting = "Dear Sir/Madam,";
      body = `I acknowledge your ${intent.toLowerCase()} about "${subject}".\n\n`;
      body += "We take this matter seriously and will address it promptly.\n\n";
      closing = "Sincerely,";
      break;
    default:
      greeting = "Hello,";
      body = `I'm writing in response to your ${intent.toLowerCase()} about "${subject}".\n\n`;
  }

  // Adjust based on intent
  switch (intent.toLowerCase()) {
    case "inquiry":
      body += "I'll provide you with the requested information shortly.\n\n";
      break;
    case "complaint":
      body +=
        "We are investigating this issue and will get back to you with a resolution.\n\n";
      break;
    case "request":
      body += "We are processing your request and will update you soon.\n\n";
      break;
    case "follow-up":
      body += "As a follow-up, here are the updates on this matter.\n\n";
      break;
  }

  if (isSpam) {
    body +=
      "Note: This email was flagged for review. Please verify its legitimacy.\n\n";
  }

  return `Subject: ${subjectPrefix}Re: ${subject}\n\n${greeting}\n\n${body}\n${closing}\n[Your Name]`;
}

// OPTIONAL: Separate function for streaming if you need it
export async function* generateMailFromAnalysisStreaming(
  analysis: SubjectAnalysis,
  subject: string
): AsyncGenerator<string> {
  const { confidence, intent, isSpam, sentiment } = analysis;

  // Input validation
  if (!subject.trim()) {
    throw new Error("Subject cannot be empty");
  }

  // Create a prompt for the AI
  const prompt = `You are a professional email writing assistant. Generate a professional email based on this analysis:

ORIGINAL SUBJECT: ${subject}
INTENT: ${intent}
SENTIMENT: ${sentiment}
CONFIDENCE LEVEL: ${Math.round(confidence * 100)}%
SPAM INDICATOR: ${isSpam ? "Potential spam detected" : "Not spam"}

INSTRUCTIONS:
1. Write an email that appropriately addresses the detected intent (${intent})
2. Match the tone to the sentiment (${sentiment})
3. Include a relevant subject line (start with "Subject: ")
4. Use professional email structure
5. Keep it concise but complete
6. ${isSpam ? "Be cautious - this may be spam" : "Proceed normally"}

Generate only the email content:`;

  try {
    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an expert email writer. Generate professional, appropriate emails.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error(
      "[generateMailFromAnalysisStreaming] AI Generation Failed:",
      error
    );

    // Fallback: yield the fallback email as a single chunk
    const fallbackEmail = generateFallbackEmail(analysis, subject);
    yield fallbackEmail;
  }
}
