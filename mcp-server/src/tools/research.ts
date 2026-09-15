import { SearchSourcesInput, SummarizeArticleInput } from '../types/schemas.js';

export const searchSources = {
  schema: SearchSourcesInput,
  handler: async ({ query, sources }: { query: string; sources?: string[] }) => {
    const results: Array<{ url: string; title: string; summary: string; source: string }> = [];

    if (!sources || sources.includes('hn')) {
      try {
        const hnUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=10`;
        const response = await fetch(hnUrl);
        const data = await response.json() as any;

        for (const hit of data.hits || []) {
          results.push({
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            title: hit.title || 'Untitled',
            summary: hit.story_text || hit.title || '',
            source: 'hn'
          });
        }
      } catch (error) {
        console.error('HN search failed:', error);
      }
    }

    return results;
  }
};

// Deterministic extractive summarizer + bridge to the connected omniroute-mcp.
//
// The LLM-powered analysis lives in the connected omniroute-mcp
// (`omniroute_route_request` with automatic best-model routing).
// This tool:
//  - if the agent already produced summary/facts/quotes via omniroute-mcp,
//    validates and structures them (passthrough);
//  - otherwise returns a deterministic extractive fallback (lead sentences,
//    quoted strings) so the pipeline never hard-depends on an LLM call.
function extractiveFallback(content: string): { summary: string; facts: string[]; quotes: string[] } {
  const text = content.replace(/\s+/g, ' ').trim();
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 40) ?? [];
  const summary = sentences.slice(0, 3).join(' ');
  const facts = sentences.slice(3, 8);
  const quotes = Array.from(content.matchAll(/"([^"]{20,300})"/g)).map(m => m[1]).slice(0, 5);
  return { summary, facts, quotes };
}

export const summarizeArticle = {
  schema: SummarizeArticleInput,
  handler: async ({ content, url, summary, facts, quotes }: {
    content: string;
    url: string;
    summary?: string;
    facts?: string[];
    quotes?: string[];
  }) => {
    if (summary || (facts && facts.length) || (quotes && quotes.length)) {
      return {
        summary: summary ?? '',
        facts: facts ?? [],
        quotes: quotes ?? [],
        source: 'agent-llm-passthrough',
        url
      };
    }

    const fallback = extractiveFallback(content.substring(0, 10000));
    return {
      ...fallback,
      source: 'extractive-fallback',
      url,
      note: 'Extractive fallback only. For abstractive analysis, generate via omniroute-mcp `omniroute_route_request` then re-call with summary/facts/quotes.'
    };
  }
};
