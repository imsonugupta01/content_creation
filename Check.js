// check-groq.js
const GROQ_API_KEY = "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"; // gsk_ se shuru hoti hai

async function checkGroqKey() {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",  // ✅ Naya model
        messages: [{ role: "user", content: "Ek chhoti Hindi story likho. 3-5 lines. Har line ke end mein poora viraam (।) lagao. Simple emotional Hindi. Sirf story text do, kuch aur nahi.Idea: ek gareeb ladka jo mehnat se IAS officer banta hai." }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ Key invalid:", data.error.message);
    } else {
      console.log("✅ Key valid:", data.choices?.[0]?.message?.content);
    }
  } catch (e) {
    console.error("⚠️ Network error:", e.message);
  }
}

checkGroqKey();