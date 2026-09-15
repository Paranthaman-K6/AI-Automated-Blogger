---
name: blog-scrape
description: Ethical web scraping skill with robots.txt compliance, rate limiting, and User-Agent identification. Use ONLY when scraping content from web sources, checking robots.txt permissions, implementing delays, or extracting content while respecting site policies.
---

# Blog Scrape Skill

Ethical web scraping rules and implementation patterns.

## Tool Routing: Connected-MCP-First (Mandatory)

- **Primary:** connected omniroute-mcp `omniroute_web_search` (discovery) + `omniroute_web_fetch` (page content, Firecrawl/Jina/Tavily failover with JS rendering).
- **Gate:** automated-blogger `check_robots` MUST pass before ANY fetch — primary or fallback. Cache per domain 24h.
- **Fallback (offline only):** automated-blogger `search_sources` (HN API) for HackerNews discovery; `scrape_source` (plain HTTP, no JS rendering) ONLY when `omniroute_web_fetch` fails or is unavailable.
- **Model routing:** `auto/best-free` via `omniroute_route_request`. NEVER use direct OmniRoute API keys, base URLs, or pinned model names.
- The JavaScript patterns below apply to the **fallback path only** (and to illustrate the ethics semantics that `check_robots` + rate limiting enforce). Prefer the MCP tools over hand-rolled fetch.

## Robots.txt Compliance

### Mandatory Pre-Scrape Check

**NEVER scrape without checking robots.txt first.**

```javascript
// robots.txt checker
async function checkRobotsTxt(url) {
  const domain = new URL(url).origin;
  const robotsUrl = `${domain}/robots.txt`;
  
  try {
    const response = await fetch(robotsUrl);
    const robotsTxt = await response.text();
    
    return parseRobotsTxt(robotsTxt, url);
  } catch (error) {
    // If robots.txt doesn't exist, scraping is allowed
    // but still respect rate limits
    return { allowed: true, crawlDelay: 2 };
  }
}

function parseRobotsTxt(robotsTxt, targetUrl) {
  const userAgent = 'AutomatedBlogger';
  let currentAgent = '*';
  let rules = { disallow: [], crawlDelay: null };
  
  for (const line of robotsTxt.split('\n')) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('user-agent:')) {
      const agent = trimmed.split(':')[1].trim();
      if (agent === userAgent.toLowerCase() || agent === '*') {
        currentAgent = agent;
      }
    }
    
    if (currentAgent === userAgent.toLowerCase() || currentAgent === '*') {
      if (trimmed.startsWith('disallow:')) {
        const path = trimmed.split(':')[1].trim();
        rules.disallow.push(path);
      }
      
      if (trimmed.startsWith('crawl-delay:')) {
        const delay = parseInt(trimmed.split(':')[1].trim());
        rules.crawlDelay = delay;
      }
    }
  }
  
  // Check if target URL is disallowed
  const path = new URL(targetUrl).pathname;
  const allowed = !rules.disallow.some(disallowPath => {
    if (disallowPath === '/') return true; // Fully blocked
    return path.startsWith(disallowPath);
  });
  
  return {
    allowed,
    crawlDelay: rules.crawlDelay || 2, // Default 2 seconds
    rules: rules.disallow
  };
}
```

### robots.txt Caching

Cache robots.txt for 24 hours per domain:

```javascript
const robotsCache = new Map();

async function getCachedRobotsTxt(domain) {
  const cached = robotsCache.get(domain);
  
  if (cached && Date.now() - cached.timestamp < 86400000) {
    return cached.rules;
  }
  
  const rules = await checkRobotsTxt(domain);
  robotsCache.set(domain, {
    rules,
    timestamp: Date.now()
  });
  
  return rules;
}
```

## Rate Limiting

### Delay Implementation

**Always wait between requests to the same domain.**

```javascript
class RateLimiter {
  constructor() {
    this.lastRequest = new Map();
  }
  
  async throttle(domain, crawlDelay = 2000) {
    const lastTime = this.lastRequest.get(domain) || 0;
    const elapsed = Date.now() - lastTime;
    const waitTime = Math.max(0, crawlDelay - elapsed);
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest.set(domain, Date.now());
  }
}

const rateLimiter = new RateLimiter();

// Usage
await rateLimiter.throttle('example.com', 2000); // 2 second delay
```

### Request Limits

- **Max 10 requests per domain per minute**
- **Max 100 requests per domain per hour**
- **Max 5 concurrent requests total** (across all domains)

```javascript
class RequestQuota {
  constructor() {
    this.minuteQuota = new Map();
    this.hourQuota = new Map();
  }
  
  canRequest(domain) {
    const now = Date.now();
    
    // Check minute quota
    const minuteKey = `${domain}:${Math.floor(now / 60000)}`;
    const minuteCount = this.minuteQuota.get(minuteKey) || 0;
    if (minuteCount >= 10) return false;
    
    // Check hour quota
    const hourKey = `${domain}:${Math.floor(now / 3600000)}`;
    const hourCount = this.hourQuota.get(hourKey) || 0;
    if (hourCount >= 100) return false;
    
    return true;
  }
  
  recordRequest(domain) {
    const now = Date.now();
    const minuteKey = `${domain}:${Math.floor(now / 60000)}`;
    const hourKey = `${domain}:${Math.floor(now / 3600000)}`;
    
    this.minuteQuota.set(minuteKey, (this.minuteQuota.get(minuteKey) || 0) + 1);
    this.hourQuota.set(hourKey, (this.hourQuota.get(hourKey) || 0) + 1);
  }
}
```

### Exponential Backoff

On errors (429, 503, timeouts):

```javascript
async function fetchWithBackoff(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });
      
      if (response.status === 429 || response.status === 503) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, backing off ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## User-Agent Identification

### Required User-Agent Format

Always identify yourself with contact information:

```javascript
const USER_AGENT = 'AutomatedBlogger/1.0 (+https://yourblog.com/about; contact@yourblog.com)';

const headers = {
  'User-Agent': USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive'
};
```

### User-Agent Components

1. **Bot name** - AutomatedBlogger
2. **Version** - 1.0
3. **Website** - Where admins can learn about your bot
4. **Contact** - Email for questions/complaints

**BAD:** Generic or fake user agents
```javascript
// ❌ DON'T DO THIS
'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Pretending to be a browser
'Python-requests/2.31.0' // Not identifying your specific bot
```

**GOOD:** Honest identification
```javascript
// ✅ DO THIS
'AutomatedBlogger/1.0 (+https://yourblog.com/about; contact@yourblog.com)'
```

## Content Extraction

### Respectful Scraping

```javascript
async function scrapePage(url) {
  // 1. Check robots.txt
  const domain = new URL(url).origin;
  const robotsRules = await getCachedRobotsTxt(domain);
  
  if (!robotsRules.allowed) {
    throw new Error(`Scraping blocked by robots.txt: ${url}`);
  }
  
  // 2. Check quota
  if (!requestQuota.canRequest(domain)) {
    throw new Error(`Rate limit exceeded for ${domain}`);
  }
  
  // 3. Apply rate limiting
  await rateLimiter.throttle(domain, robotsRules.crawlDelay * 1000);
  
  // 4. Fetch with proper headers
  const response = await fetchWithBackoff(url);
  
  // 5. Record request
  requestQuota.recordRequest(domain);
  
  // 6. Extract content
  const html = await response.text();
  const content = extractContent(html);
  
  return content;
}

function extractContent(html) {
  // Use a library like cheerio or jsdom
  const $ = cheerio.load(html);
  
  // Remove scripts, styles, ads
  $('script, style, iframe, .ad, .advertisement').remove();
  
  // Extract main content
  const title = $('h1').first().text().trim();
  const author = $('meta[name="author"]').attr('content') || 
                 $('.author').first().text().trim();
  const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                      $('time').first().attr('datetime');
  const content = $('article, .post-content, main').first().text().trim();
  
  return {
    title,
    author,
    publishDate,
    content,
    url
  };
}
```

### Extraction Strategies

**Try these selectors in order:**

1. **Semantic HTML** - `<article>`, `<main>`
2. **Common class names** - `.post-content`, `.article-body`, `.entry-content`
3. **Microdata** - `[itemprop="articleBody"]`
4. **OpenGraph** - `<meta property="og:description">`
5. **Fallback** - Longest `<p>` blocks

```javascript
function extractMainContent($) {
  const strategies = [
    () => $('article').first().text(),
    () => $('main').first().text(),
    () => $('.post-content, .article-body, .entry-content').first().text(),
    () => $('[itemprop="articleBody"]').first().text(),
    () => {
      // Find longest paragraph block
      let longest = '';
      $('p').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > longest.length) {
          longest = text;
        }
      });
      return longest;
    }
  ];
  
  for (const strategy of strategies) {
    const content = strategy();
    if (content && content.length > 100) {
      return content.trim();
    }
  }
  
  return null;
}
```

## Ethical Boundaries

### Allowed

✅ Scraping for research and analysis  
✅ Extracting publicly visible content  
✅ Caching for personal use  
✅ Short quotes with attribution  
✅ Fact verification  

### Not Allowed

❌ Bypassing robots.txt  
❌ Overwhelming servers with requests  
❌ Scraping paywalled content  
❌ Circumventing login walls  
❌ Copying entire articles  
❌ Removing watermarks/attribution  
❌ Commercial redistribution without permission  

## Error Handling

### Common Errors

```javascript
async function safeScrapePage(url) {
  try {
    return await scrapePage(url);
  } catch (error) {
    if (error.message.includes('robots.txt')) {
      console.error(`❌ Blocked by robots.txt: ${url}`);
      return null; // Skip this source
    }
    
    if (error.message.includes('Rate limit')) {
      console.warn(`⏳ Rate limited, will retry later: ${url}`);
      // Queue for retry in 5 minutes
      return 'retry_later';
    }
    
    if (error.message.includes('404')) {
      console.error(`❌ Not found: ${url}`);
      return null; // Dead link
    }
    
    if (error.message.includes('timeout')) {
      console.warn(`⏱️ Timeout, will retry: ${url}`);
      return 'retry';
    }
    
    // Unknown error
    console.error(`❌ Scraping failed: ${url}`, error);
    return null;
  }
}
```

### Graceful Degradation

If scraping fails:
1. Try alternative sources
2. Use cached version (if recent)
3. Request content via RSS feed
4. Manual review fallback

## Performance Optimization

### Concurrent Requests (with limits)

```javascript
async function scrapeMultiple(urls) {
  const MAX_CONCURRENT = 5;
  const results = [];
  
  for (let i = 0; i < urls.length; i += MAX_CONCURRENT) {
    const batch = urls.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(url => safeScrapePage(url))
    );
    results.push(...batchResults);
    
    // Delay between batches
    if (i + MAX_CONCURRENT < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results.filter(r => r !== null);
}
```

### Content Caching

Cache scraped content for 24 hours:

```javascript
const contentCache = new Map();

async function getCachedContent(url) {
  const cached = contentCache.get(url);
  
  if (cached && Date.now() - cached.timestamp < 86400000) {
    return cached.content;
  }
  
  const content = await scrapePage(url);
  contentCache.set(url, {
    content,
    timestamp: Date.now()
  });
  
  return content;
}
```

## Testing Checklist

Before deploying scraper:

- [ ] robots.txt checker works correctly
- [ ] Rate limiting enforced (test with timer)
- [ ] User-Agent includes contact info
- [ ] Handles 429 responses gracefully
- [ ] Respects Crawl-delay directive
- [ ] Timeout after 30 seconds
- [ ] Max 10 requests per minute per domain
- [ ] Logs all scraping activity
- [ ] Fails safely when blocked
- [ ] Doesn't scrape disallowed paths

## Monitoring

Log all scraping activity:

```javascript
function logScrapingActivity(url, success, details) {
  const log = {
    timestamp: new Date().toISOString(),
    url,
    domain: new URL(url).hostname,
    success,
    robotsAllowed: details.robotsAllowed,
    crawlDelay: details.crawlDelay,
    responseTime: details.responseTime,
    contentLength: details.contentLength
  };
  
  // Store in OmniRoute memory
  omniroute.memory.add({
    type: 'episodic',
    key: `scraping_log_${Date.now()}`,
    content: JSON.stringify(log)
  });
}
```

Track metrics:
- Requests per domain per hour
- Average response time
- Success/failure rate
- robots.txt block rate
- Rate limit hit rate
