/**
 * Test script to verify web search is working
 * Run: node test-web-search.js
 */

async function testWebSearch() {
  console.log("🧪 Testing Web Search Configuration\n");

  // Check environment variables
  console.log("1️⃣ Checking API Keys:");
  const serperKey = process.env.SERPER_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  console.log(`   SERPER_API_KEY: ${serperKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`   TAVILY_API_KEY: ${tavilyKey ? "✅ Set" : "❌ Missing"}`);

  if (!serperKey && !tavilyKey) {
    console.log("\n❌ ERROR: No API keys found!");
    console.log("   Make sure .env.local contains:");
    console.log("   SERPER_API_KEY=your-key-here");
    console.log("   TAVILY_API_KEY=your-key-here");
    return;
  }

  console.log("\n2️⃣ Testing Serper API:");
  if (serperKey) {
    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": serperKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: "Utah Cancer Registry contact",
          num: 3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `   ✅ Serper API working! Found ${data.organic?.length || 0} results`
        );
        if (data.organic?.[0]) {
          console.log(`   First result: ${data.organic[0].title}`);
        }
      } else {
        console.log(
          `   ❌ Serper API error: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Serper API error: ${error.message}`);
    }
  } else {
    console.log("   ⏭️  Skipped (no key)");
  }

  console.log("\n3️⃣ Testing Tavily API:");
  if (tavilyKey) {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: "Utah Cancer Registry contact",
          max_results: 3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `   ✅ Tavily API working! Found ${data.results?.length || 0} results`
        );
        if (data.results?.[0]) {
          console.log(`   First result: ${data.results[0].title}`);
        }
      } else {
        console.log(
          `   ❌ Tavily API error: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Tavily API error: ${error.message}`);
    }
  } else {
    console.log("   ⏭️  Skipped (no key)");
  }

  console.log("\n📋 Summary:");
  console.log(
    "   If both APIs are working, the chatbot should use web search."
  );
  console.log(
    "   If you're still seeing 'please search online yourself', restart your dev server:"
  );
  console.log("   1. Stop the server (Ctrl+C)");
  console.log("   2. Run: pnpm dev");
  console.log("   3. Try the chatbot again\n");
}

// Load .env.local
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

testWebSearch().catch(console.error);
