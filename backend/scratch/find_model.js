import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function findBestModel() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    const models = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    console.log("Models supporting generateContent:");
    models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

findBestModel();
