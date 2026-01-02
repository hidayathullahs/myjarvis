require('dotenv').config();

// Polyfill fetch for older Node if necessary, though mostly not needed for v18+
// checking if fetch exists
if (!global.fetch) {
    console.log("Using node-fetch polyfill");
    global.fetch = require('node-fetch');
}

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key present:", !!apiKey);
if (apiKey) console.log("API Key length:", apiKey.length);

const model = 'gemini-pro';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const payload = {
    contents: [{
        parts: [{ text: "Hello, are you online?" }]
    }]
};

(async () => {
    try {
        console.log(`Testing connection to: ${url.replace(apiKey, 'HIDDEN_KEY')}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log("Status Code:", response.status);
        if (!response.ok) {
            console.error("Response Error Text:", await response.text());
        } else {
            const data = await response.json();
            console.log("Success! Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch Exception:", e);
    }
})();
