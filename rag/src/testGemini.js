const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testGemini() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Say hello to ClubOps RAG in one sentence.",
    });

    console.log(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
  }
}

testGemini();