const { GoogleGenerativeAI } = require("@google/generative-ai");
const { scrapeReddit } = require("./scraper");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
require('dotenv').config();

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Swapped to business and local El Paso sources
const localSources = ['elpaso', 'smallbusiness', 'restaurantowners', 'Entrepreneur'];

async function generateAdCopy() {
  console.log("Fetching Reddit data from multiple sources...");
  let allRedditData = [];
  
  for (const source of localSources) {
    console.log(`Pulling from r/${source}...`);
    const posts = await scrapeReddit(source);
    if (posts && posts.length > 0) {
      allRedditData = allRedditData.concat(posts);
    }
  }
  
  const contextText = allRedditData.map(post => `[From r/${post.source}] Title: ${post.title}\nBody: ${post.text}`).join('\n\n');

  console.log("\nAnalyzing data and writing Sun City Connect taglines...");
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are the lead growth marketer for Sun City Connect, El Paso's premier AI automation agency.
    
    CRITICAL CONTEXT ABOUT SUN CITY CONNECT:
    We build custom 24/7 AI sales assistants (DM bots) for local businesses (restaurants, realtors, contractors, etc.). 
    We solve the problem of business owners acting like robots—answering the same pricing questions all day, missing late-night DMs while they sleep, and losing impatient leads to faster competitors. Our bots reply instantly, pre-qualify leads, and book appointments 24/7.

    Read the following recent Reddit posts from local and business subreddits to understand current frustrations:
    
    ${contextText}
    
    TASK: 
    Write 5 punchy, zero-BS, highly relatable taglines for Instagram and Meta ads based on the frustrations in the text. 
    
    RULES:
    1. Agitate the problem of lost leads, wasted time, and answering DMs at 11 PM.
    2. Position Sun City Connect as the ultimate 24/7 digital employee.
    3. Make them sound human, bold, and authoritative. Do NOT sound like corporate AI.
    4. Keep each tagline under 15 words.
    5. Occasionally drop a subtle El Paso reference to build local trust.
    
    Output ONLY the 5 taglines, numbered 1 through 5.`;

  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🧠 Thinker is writing the ad copy... (Attempt ${attempt}/${maxRetries})`);
      const result = await model.generateContent(prompt);
      const taglines = result.response.text();
      
      console.log("\n=== GENERATED MARKETING COPY ===");
      console.log(taglines);
      
      return taglines; 

    } catch (error) {
      if (error.status === 503 && attempt < maxRetries) {
        console.log("⏳ Google Gemini is currently busy. Waiting 10 seconds before retrying...");
        await sleep(10000); 
      } else {
        console.error("❌ AI Generation completely failed:", error.message);
        return null;
      }
    }
  }
}

module.exports = { generateAdCopy };