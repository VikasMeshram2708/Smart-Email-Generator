// Create a prompt for the AI
const prompt = `Generate a professional email based on the following analysis:
  
 Subject: ${subject}
 Intent: ${intent}
 Sentiment: ${sentiment}
 Confidence: ${confidence}
 Is Spam: ${isSpam ? "Yes" : "No"}
 
 Please generate an appropriate email that:
 1. Matches the detected intent: ${intent}
 2. Appropriately reflects the sentiment: ${sentiment}
 3. Is professional and clear
 4. Includes a subject line
 5. Has proper email structure (greeting, body, closing)
 
 Generate only the email content (including subject line).`;
