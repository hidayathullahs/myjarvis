// test.js - OpenAI test with environment check

// 1️⃣ Load environment variables
require("dotenv").config();

// 2️⃣ Import OpenAI
const OpenAI = require("openai");

// 3️⃣ Verify API key is loaded
console.log(
  "🔑 Your API Key:",
  process.env.OPENAI_API_KEY ? "Loaded ✅" : "Missing ❌"
);

// 4️⃣ Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // must be set in .env
});

// 5️⃣ Test OpenAI call
async function main() {
  console.log("🚀 OpenAI test started");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello from test.js!" }],
    });

    console.log("✅ OpenAI says:", response.choices[0].message.content);
  } catch (error) {
    console.error("❌ OpenAI error:", error);
  }
}

main();
