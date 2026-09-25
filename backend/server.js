import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { buildIndex, retrieve } from "./rag/retriever.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set. Add it to backend/.env before chatting.");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Simple health check, useful for confirming the server is up.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Builds the systemInstruction sent to Gemini: fixed RAG rules + whatever
// product data was retrieved for this specific user query.
function buildSystemInstruction(matches) {
  const contextBlock =
    matches.length > 0
      ? matches.map((m) => m.document).join("\n\n---\n\n")
      : "No matching product data was found for this question.";

  const text = `You are a product assistant for a networking-equipment store. Answer the user's question using ONLY the "Retrieved product data" below.

Rules:
- Never use outside/general knowledge for product-specific facts (price, stock, features, specifications, availability, compatibility, performance).
- If the retrieved data does not contain the information the user asked for, clearly say you don't have that information in the available product data instead of guessing or inventing an answer.
- If multiple retrieved products match the user's request (e.g. a brand or price filter), mention all of them.
- Reply in the same language/style the user used (English, Urdu, or Roman Urdu).
- Keep answers natural and conversational, not a raw data dump.

Retrieved product data:
${contextBlock}`;

  return { parts: [{ text }] };
}

// Main chat endpoint. Accepts { messages: [{ role: "user" | "assistant", content: string }] }
// and streams the Gemini response back as plain text chunks.
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Request body must include a non-empty 'messages' array." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Add it to backend/.env and restart the server.",
    });
  }

  // Gemini expects "model" instead of "assistant", and each message wrapped in { parts: [...] }
  const contents = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  if (contents.length === 0) {
    return res.status(400).json({ error: "No valid messages found in request." });
  }

  // RAG step: retrieve relevant product data for the latest user message
  // and turn it into a systemInstruction Gemini must ground its answer in.
  const latestUserMessage = [...messages].reverse().find((m) => m && m.role === "user");
  let systemInstruction = buildSystemInstruction([]);

  if (latestUserMessage?.content) {
    try {
      const { matches } = await retrieve(latestUserMessage.content);
      systemInstruction = buildSystemInstruction(matches);
    } catch (err) {
      console.error("RAG retrieval failed, continuing without retrieved context:", err);
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

  let geminiResponse;
  try {
    geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, systemInstruction }),
    });
  } catch (err) {
    console.error("Network error calling Gemini API:", err);
    return res.status(502).json({ error: "Could not reach the Gemini API. Check your internet connection." });
  }

  if (!geminiResponse.ok) {
    let detail = "";
    try {
      const errBody = await geminiResponse.json();
      detail = errBody?.error?.message || "";
    } catch (_) {
      // response body wasn't JSON, ignore
    }
    console.error("Gemini API returned an error:", geminiResponse.status, detail);

    if (geminiResponse.status === 400 && /api key/i.test(detail)) {
      return res.status(401).json({ error: "Invalid Gemini API key. Double check backend/.env." });
    }
    if (geminiResponse.status === 429) {
      return res.status(429).json({ error: "Gemini API rate limit reached. Wait a moment and try again." });
    }
    return res.status(geminiResponse.status).json({ error: detail || "Gemini API request failed." });
  }

  // Stream the response back to the client as it arrives.
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");

  const reader = geminiResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // last (possibly incomplete) line stays in the buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
          if (text) res.write(text);
        } catch (_) {
          // partial/malformed JSON chunk, skip it
        }
      }
    }
  } catch (err) {
    console.error("Error while streaming Gemini response:", err);
  } finally {
    res.end();
  }
});

// Build the RAG embedding index once at startup, then start accepting requests.
buildIndex()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to build RAG index, starting server anyway:", err);
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  });