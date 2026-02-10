import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error(
    "[OpenAI] OPENAI_API_KEY is not set. AI features will use fallback mode."
  );
}

export const openai = new OpenAI({
  apiKey: apiKey || "missing-key",
});

export const CONTACT_AGENT_MODEL = "gpt-4o"; // Using GPT-4o for function calling
