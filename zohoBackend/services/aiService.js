const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

exports.analyzeMessages = async (messages = []) => {
  if (messages.length === 0) return { decision: "Skip", sentiment: "Unknown", reply: "" };

  const lastMessage = stripHtml(messages[messages.length - 1]?.content || "");

  const prompt = `
You are a customer-support AI.

Rules (follow strictly):
• If the issue is generic (e.g. slow internet, downtime) and needs no technician or payment action:
  – Decision: Respond
  – Sentiment: Positive, Neutral, or Negative
  – Reply: ONE short paragraph, max 2 sentences.
• If the issue needs installation, payment confirmation, relocation, any attachment, or a field visit:
  – Decision: Skip
  – Sentiment: Positive, Neutral, or Negative
  – Reply: (leave completely blank).
• Never ask the customer for any further information.
• Add at the last line:
  - Thank you for choosing Tizeti Network Limited. <new line> Regards.


Respond exactly:

Decision: <Respond|Skip>
Sentiment: <Positive|Neutral|Negative>
Reply: <blank if Skip>

Customer message:
${lastMessage}
`;

  const result = await model.generateContent(prompt);
  const output = await result.response.text();

  const decision = output.match(/Decision:\s*(.*)/i)?.[1]?.trim() || "Skip";
  const sentiment = output.match(/Sentiment:\s*(.*)/i)?.[1]?.trim() || "Unknown";
  const reply = output.match(/Reply:\s*([\s\S]*)/i)?.[1]?.trim() || "";

  return { decision, sentiment, reply };
};
