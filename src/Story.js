
import React, { useState } from "react";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

async function generateStory(idea) {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key missing. Check your .env file.");
  }

  const prompt = `Write a very short Hindi story in 3-4 lines about: ${idea}. End each line with a full stop (।). Only give story text, no title or explanation.`;

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "Groq API request failed."
    );
  }

  return data.choices?.[0]?.message?.content?.trim() || "";
}

export default function StoryGenerator({ onStoryGenerated }) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError("Pehle idea likho.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const story = await generateStory(idea.trim());

      if (!story) {
        throw new Error("Empty story received. Try again.");
      }

      onStoryGenerated(story);
      setIdea("");
    } catch (err) {
      setError(err.message || "Story generate nahi hui.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
      <label className="block text-sm font-semibold uppercase tracking-wider text-emerald-400">
        ✨ AI Story Generator (Groq)
      </label>

      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Idea likho — jaise: ek gareeb ladka jo mehnat se IAS banta hai"
        rows={10}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base leading-relaxed outline-none focus:border-emerald-500 resize-none"
        disabled={loading}
      />

      <button
        onClick={handleGenerate}
        disabled={loading || !idea.trim()}
        className="w-full py-3 rounded-lg font-semibold text-base bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition"
      >
        {loading ? "Story ban rahi hai..." : "🪄 Generate Story"}
      </button>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
