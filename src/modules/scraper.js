async function scrapeReddit(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=15`;
  
  // The Bouncer: Filter out politics and old dating app keywords
  const bannedWords = ['politics', 'election', 'vote', 'democrat', 'republican', 'mayor', 'president', 'trump', 'biden', 'council', 'ICE', 'dating', 'tinder', 'bumble'];

  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'SunCityConnectMarketing/1.0' } });
    const data = await response.json();
    
    // Filter and clean the data
    const cleanPosts = data.data.children
      .filter(child => {
        const title = child.data.title.toLowerCase();
        const text = child.data.selftext.toLowerCase();
        return !bannedWords.some(word => title.includes(word) || text.includes(word));
      })
      .map(child => ({
        title: child.data.title,
        text: child.data.selftext
      }))
      .slice(0, 5); 
    
    console.log(`Successfully scraped ${cleanPosts.length} clean posts from ${subreddit}`);
    return cleanPosts;
    
  } catch (error) {
    console.error("Scraping failed:", error);
  }
}

module.exports = { scrapeReddit };