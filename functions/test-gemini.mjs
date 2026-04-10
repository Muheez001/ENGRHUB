import fetch from 'node-fetch';

async function testGemini() {
    const key = "AIzaSyDaU7Zje0EHTlA4fALi29P83kUMXZgY2fs";
    console.log("Testing with API Key:", key.substring(0, 10) + "...");
    
    // Tiny Payload Test
    const payload = {
        contents: [{ parts: [{ text: "Hi, respond with 'hello'" }] }]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("❌ FAILED - HTTP", response.status);
            console.error("RESPONSE BODY:", err);
        } else {
            const data = await response.json();
            console.log("✅ SUCCESS - Response:", data.candidates[0].content.parts[0].text);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testGemini();
