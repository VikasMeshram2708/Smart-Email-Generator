"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SubjectAnalysis } from "@/utils/subject-analysis-schema";
import { useState, useTransition } from "react";
import { analyzeSubjectAction } from "./actions/analyze-subject";
import { generateMailFromAnalysis } from "./actions/generate-mail";
import { toast } from "sonner";
import { Copy, RefreshCw, Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function Home() {
  const [result, setResult] = useState<SubjectAnalysis | null>(null);
  const [emailContent, setEmailContent] = useState<string>("");
  const [subjectInput, setSubjectInput] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleAnalyze(formData: FormData) {
    const subject = formData.get("subject");

    // Type guard to ensure it's a string
    if (typeof subject !== "string" || !subject.trim()) {
      toast.error("Please enter a valid subject");
      return;
    }

    const subjectString = subject.trim();
    setSubjectInput(subjectString);

    startTransition(async () => {
      try {
        const res = await analyzeSubjectAction(subjectString);
        setResult(res);
        setEmailContent(""); // Clear previous email
        toast.success("Subject analyzed successfully!");
      } catch (error) {
        console.error("Analysis failed:", error);
        toast.error("Failed to analyze subject. Please try again.");
      }
    });
  }

  async function handleGenerateEmail() {
    if (!result || !subjectInput.trim()) {
      toast.error("Please analyze a subject first");
      return;
    }

    setIsGenerating(true);
    toast.info("AI is generating your email...");

    try {
      const email = await generateMailFromAnalysis(result, subjectInput);
      setEmailContent(email);
      toast.success("Email generated successfully!");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error("Failed to generate email. Please try again.");
      // Fallback to a simple email
      setEmailContent(generateFallbackEmail(result, subjectInput));
    } finally {
      setIsGenerating(false);
    }
  }

  // Helper function to determine badge variant based on intent
  function getIntentBadgeVariant(intent: SubjectAnalysis["intent"]) {
    switch (intent) {
      case "marketing":
        return "secondary";
      case "support":
        return "default";
      case "personal":
        return "outline";
      case "spam":
        return "destructive";
      case "unknown":
        return "outline";
      default:
        return "outline";
    }
  }

  // Helper function to get intent display name
  function getIntentDisplayName(intent: SubjectAnalysis["intent"]): string {
    switch (intent) {
      case "marketing":
        return "Marketing";
      case "support":
        return "Support";
      case "personal":
        return "Personal";
      case "spam":
        return "Spam";
      case "unknown":
        return "Unknown";
      default:
        return intent;
    }
  }

  // Fallback function for email generation
  function generateFallbackEmail(
    analysis: SubjectAnalysis,
    subject: string
  ): string {
    const { intent, sentiment, isSpam } = analysis;

    const subjectPrefix = isSpam ? "[Review Needed] " : "";
    let greeting = "Hello,";
    let body = "";
    let closing = "Best regards,";

    switch (sentiment.toLowerCase()) {
      case "positive":
        body = `Thank you for your message regarding "${subject}".\n\n`;
        closing = "Warm regards,";
        break;
      case "negative":
        greeting = "Dear Sir/Madam,";
        body = `I acknowledge your message about "${subject}".\n\n`;
        body +=
          "We take this matter seriously and will address it promptly.\n\n";
        closing = "Sincerely,";
        break;
      default:
        body = `I'm writing in response to your message about "${subject}".\n\n`;
    }

    // Adjust based on intent if needed
    switch (intent) {
      case "support":
        body += "Our support team will assist you with this matter.\n\n";
        break;
      case "marketing":
        body += "Thank you for your interest in our products/services.\n\n";
        break;
      case "spam":
        body += "Note: This message has been flagged for review.\n\n";
        break;
    }

    return `Subject: ${subjectPrefix}Re: ${subject}\n\n${greeting}\n\n${body}\n${closing}\n[Your Name]`;
  }

  // Function to extract subject from email content
  function getEmailSubject(email: string): string {
    const subjectMatch = email.match(/Subject:\s*(.+)/i);
    return subjectMatch ? subjectMatch[1] : `Re: ${subjectInput}`;
  }

  // Function to extract body from email content
  function getEmailBody(email: string): string {
    // Remove subject line if present
    return email.replace(/Subject:\s*.+\n*/i, "").trim();
  }

  // Function to copy email to clipboard
  async function copyToClipboard() {
    if (!emailContent) {
      toast.error("No email to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(emailContent);
      toast.success("Email copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  }

  // Function to reset the form
  function resetForm() {
    setResult(null);
    setEmailContent("");
    setSubjectInput("");
    toast.info("Form cleared");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-yellow-500 to-pink-600 mb-3">
            Smart Email Generator
          </h1>
          <p className="text-gray-400 text-lg">
            Analyze email subjects and generate perfect responses with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input and Analysis */}
          <div className="space-y-8">
            {/* Input Card */}
            <Card className="shadow-lg border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Enter Email Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleAnalyze} className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="subject"
                      id="subject"
                      placeholder="e.g., 'Follow-up on yesterday's meeting' or 'Issue with recent purchase'"
                      disabled={isPending}
                      required
                      className="text-lg py-6"
                      defaultValue={subjectInput}
                    />
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 gap-2"
                        size="lg"
                      >
                        {isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          "Analyze Subject"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        size="lg"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Analysis Results Card */}
            {result && (
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Analysis Results
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Intent
                        </p>
                        <Badge
                          variant={getIntentBadgeVariant(result.intent)}
                          className="text-sm px-3 py-1 capitalize"
                        >
                          {getIntentDisplayName(result.intent)}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Sentiment
                        </p>
                        <Badge
                          variant={
                            result.sentiment === "positive"
                              ? "default"
                              : result.sentiment === "negative"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-sm px-3 py-1 capitalize"
                        >
                          {result.sentiment}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Spam Detection
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={result.isSpam ? "destructive" : "outline"}
                          className="text-sm px-3 py-1"
                        >
                          {result.isSpam ? (
                            <span className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Potential Spam
                            </span>
                          ) : (
                            "Not Spam"
                          )}
                        </Badge>
                        {result.isSpam && (
                          <p className="text-sm text-amber-600">
                            Caution: This email may be spam. Review carefully.
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateEmail}
                      disabled={isGenerating}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          AI is generating email...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Generate AI Email
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Generated Email */}
          <div>
            <Card className="shadow-lg border-2 h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated Email</span>
                  {emailContent && (
                    <Badge variant="secondary" className="text-xs">
                      Ready to Send
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emailContent ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Subject
                      </p>
                      <div className="p-3 bg-gray-50 text-black rounded-lg border">
                        <p className="font-semibold text-lg">
                          {getEmailSubject(emailContent)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500">
                          Email Body
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={copyToClipboard}
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                          <Button
                            onClick={() => setEmailContent("")}
                            variant="ghost"
                            size="sm"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={getEmailBody(emailContent)}
                        readOnly
                        className="min-h-[300px] font-mono text-sm resize-none"
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-700">
                        <strong>Tip:</strong> Review the email for accuracy,
                        customize as needed, then copy and paste into your email
                        client.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-400 mb-2">
                      No Email Generated Yet
                    </h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      {result
                        ? "Click 'Generate AI Email' to create a professional response"
                        : "Enter an email subject and analyze it first to generate an email"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Raw Data (for debugging) */}
        {/* {result && process.env.NODE_ENV === "development" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Raw Analysis Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )} */}
      </div>
    </div>
  );
}
