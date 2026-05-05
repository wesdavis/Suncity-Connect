async function scrapeReddit(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=15`; // Bumped to 15 so we still get 5 after filtering
  
  // The Bouncer: Add any words you want to skip here
  const bannedWords = ['politics', 'election', 'vote', 'democrat', 'republican', 'mayor', 'president', 'trump', 'biden', 'council','ICE'];

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'TapTapMarketing/1.0' } });
    const data = await response.json();
    
    // Filter and clean the data
    const cleanPosts = data.data.children
      .filter(child => {
        const title = child.data.title.toLowerCase();
        const text = child.data.selftext.toLowerCase();
        // Keep it ONLY if it doesn't contain any banned words
        return !bannedWords.some(word => title.includes(word) || text.includes(word));
      })
      .map(child => ({
        title: child.data.title,
        text: child.data.selftext
      }))
      .slice(0, 5); // Just grab the top 5 clean ones
    
    console.log(`Successfully scraped ${cleanPosts.length} clean posts from ${subreddit}`);
    return cleanPosts;
    
  } catch (error) {
    console.error("Scraping failed:", error);
  }
}

// Export it so our Thinker module can use it later
module.exports = { scrapeReddit };