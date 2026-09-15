import { CheckRobotsInput, ScrapeSourceInput } from '../types/schemas.js';
import { checkRobots as checkRobotsService } from '../services/robots.js';

export const checkRobots = {
  schema: CheckRobotsInput,
  handler: async ({ url }: { url: string }) => {
    const allowed = await checkRobotsService(url);
    return { allowed, url };
  }
};

// Lightweight offline fallback fetcher.
// Primary fetching is the connected omniroute-mcp `omniroute_web_fetch`
// (Firecrawl/Jina/Tavily with automatic failover) — use that first.
// This tool exists for environments without it: plain HTTP + HTML-to-text,
// always gated by robots.txt.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export const scrapeSource = {
  schema: ScrapeSourceInput,
  handler: async ({ url, selector, timeout }: { url: string; selector?: string; timeout?: number }) => {
    const allowed = await checkRobotsService(url);

    if (!allowed) {
      return {
        content: null,
        url,
        allowed: false,
        error: 'Blocked by robots.txt — use omniroute_web_fetch or an official API instead'
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout ?? 30000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AutomatedBloggerBot/1.0 (+https://yourblog.com/about)'
        }
      });
      clearTimeout(timer);

      if (!response.ok) {
        return { content: null, url, allowed: true, error: `HTTP ${response.status}` };
      }

      const html = await response.text();
      // NOTE: no CSS selector engine in the fallback — selector is accepted
      // for API compatibility and noted in the response.
      const content = htmlToText(html);
      return {
        content,
        url,
        allowed: true,
        note: selector
          ? 'Fallback fetcher has no selector engine; full-page text returned. For JS-heavy pages use omniroute_web_fetch.'
          : undefined
      };
    } catch (error) {
      return {
        content: null,
        url,
        allowed: true,
        error: error instanceof Error ? error.message : 'Scraping failed'
      };
    }
  }
};
