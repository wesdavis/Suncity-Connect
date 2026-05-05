const { GoogleGenerativeAI } = require("@google/generative-ai");
const { scrapeReddit } = require("./scraper");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
require('dotenv').config();

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of subreddits to scrape
const localSources = ['elpaso', 'UTEP', 'dating', 'funny','memes'];

async function generateAdCopy() {
  console.log("Fetching Reddit data from multiple sources...");
  let allRedditData = [];
  
  // 1. Run the Scraper (This was missing from your snippet!)
  for (const source of localSources) {
    console.log(`Pulling from r/${source}...`);
    const posts = await scrapeReddit(source);
    if (posts && posts.length > 0) {
      allRedditData = allRedditData.concat(posts);
    }
  }
  
  // 2. Turn all the collected data into a single text block
  const contextText = allRedditData.map(post => `[From r/${post.source}] Title: ${post.title}\nBody: ${post.text}`).join('\n\n');

  console.log("\nAnalyzing data and writing El Paso taglines...");
  
  // 3. Define the model
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  // 4. Build the prompt
  const prompt = `
    You are the lead growth marketer, a 22 year old latina woman, for a new social app called TapTap.
    
    CRITICAL CONTEXT ABOUT TAPTAP:
    TapTap is a hyper-local "social icebreaker." We solve the problem of going out and having zero clue who is single or wants to be approached. 
    How it works: Users walk into a social hub (bar, festival, park), check in, instantly see the profiles of other singles in the EXACT SAME ROOM, and send a digital "tap" to break the ice. It kills the awkward cold approach and gets people meeting 5 feet away, not 5 miles away.
    current events: BTS is playing at the Sun Bowl in El Paso this weekend. Tens of thousands of fans are swarming the city, hitting Cincinnati St before the show, and looking for afterparties.

    Read the following recent Reddit posts from various local and social subreddits to understand current local frustrations:
    
    ${contextText}
    
    TASK: 
    Write 5 punchy, zero-BS, highly relatable taglines for Instagram and Meta ads based on the frustrations in the text. 
    
    RULES:
    1. Make them hyper-local to El Paso, Texas. Use authentic local references.
    2. Agitate the problem and position TapTap as the dating app for introverts.
    3. Make them sound human, witty, and observational. Do NOT sound like corporate marketing or Ai, even though you are an AI. 
    4. Keep each tagline under 15 words.
    
    Output ONLY the 5 taglines, numbered 1 through 5.
  `;

  // 5. THE RETRY LOOP (Now safely wrapped around the API call)
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🧠 Thinker is writing the ad copy... (Attempt ${attempt}/${maxRetries})`);
      
      const result = await model.generateContent(prompt);
      const taglines = result.response.text();
      
      console.log("\n=== GENERATED MARKETING COPY ===");
      console.log(taglines);
      
      return taglines; // If it succeeds, it returns the text and breaks the loop

    } catch (error) {
      // Check if it's the specific 503 busy error
      if (error.status === 503 && attempt < maxRetries) {
        console.log("⏳ Google Gemini is currently busy. Waiting 10 seconds before retrying...");
        await sleep(10000); // Wait 10,000 milliseconds (10 seconds)
      } else {
        // If it's a different error, or we ran out of retries, crash gracefully
        console.error("❌ AI Generation completely failed:", error.message);
        return null;
      }
    }
  }
}

module.exports = { generateAdCopy };