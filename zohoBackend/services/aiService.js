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

• Classify the customer's sentiment (Positive, Neutral, or Negative).  
• If the issue is generic (e.g. slow internet, no connection, general downtime), write a **very brief, empathetic reply**.  
• **Never ask the customer for any information** (no email, ID, payment proof, phone, screenshots, etc.).  
• If the issue clearly needs installation, payment confirmation, relocation, or any field visit, output “Decision: Skip”.

Reply in exactly this format (no extra lines):

Decision: <Respond or Skip>
Sentiment: <Positive|Neutral|Negative>
Reply: <one-paragraph reply, max 2 sentences – do not reply if Decision is Skip>

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
