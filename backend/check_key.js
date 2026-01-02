require('dotenv').config();

// Polyfill fetch
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file");
    process.exit(1);
}

console.log(`🔑 Key found: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

(async () => {
    try {
        console.log("🔍 Testing Key Validity & Listing Available Models...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            console.error(`\n❌ API CALL FAILED: ${response.status}`);
            console.error(`Reason: ${text}`);
            if (response.status === 400 && text.includes("INVALID_ARGUMENT")) {
                console.error("Diagnosis: The API Key format is likely incorrect.");
            } else if (response.status === 403) {
                console.error("Diagnosis: API Key valid but blocked/quota exceeded/API not enabled.");
            }
        } else {
            const data = await response.json();
            console.log("\n✅ SUCCESS! API Key is VALID.");
            console.log("Found Models:");
            const modelNames = data.models.map(m => m.name.replace('models/', ''));
            console.log(modelNames.join(', '));

            // Suggest the best match
            const preferred = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
            const match = preferred.find(p => modelNames.includes(p));

            if (match) {
                console.log(`\n✅ RECOMMENDED MODEL FOR SERVER.JS: '${match}'`);
            } else {
                console.log(`\n⚠️ No standard models found. You might need to check your region or API access.`);
            }
        }

    } catch (error) {
        console.error("❌ NETWORK/SCRIPT ERROR:", error);
    }
})();
