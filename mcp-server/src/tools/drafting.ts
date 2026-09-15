import { DraftPostInput, AddDisclosureInput } from '../types/schemas.js';
import { saveDraft, getDraft } from '../services/memory.js';
import { promises as fs } from 'fs';
import path from 'path';

const DRAFTS_PATH = process.env.DRAFTS_PATH || '/home/paranthaman/Projects/automated-blogger/drafts';

// Bridge tool: the connected omniroute-mcp (`omniroute_route_request` with
// automatic best-model routing) generates the article body; this tool persists
// it as an MDX draft with frontmatter. No LLM calls happen inside this server.
export const draftPost = {
  schema: DraftPostInput,
  handler: async ({ title, research, voice, content, description, tags, sources }: {
    title: string;
    research: Array<{ url: string; summary: string; facts?: string[]; quotes?: string[] }>;
    voice?: string;
    content?: string;
    description?: string;
    tags?: string[];
    sources?: string[];
  }) => {
    if (!content || !content.trim()) {
      return {
        draftId: null,
        path: null,
        wordCount: 0,
        error: 'No article content supplied. Generate the body with omniroute-mcp `omniroute_route_request` (automatic best-model routing), then re-call draft_post with the `content` field.',
        researchReceived: research.length
      };
    }

    const metadata = {
      title,
      description: description ?? research[0]?.summary.substring(0, 160) ?? title,
      pubDate: new Date().toISOString(),
      author: 'Automated Blogger',
      voice: voice ?? 'professional',
      tags: tags ?? title.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5),
      sources: sources ?? research.map(r => r.url)
    };

    const draftId = await saveDraft(title, content, metadata);

    const draftPath = path.join(DRAFTS_PATH, 'pending', `${draftId}.mdx`);
    const wordCount = content.split(/\s+/).length;

    return {
      draftId,
      path: draftPath,
      wordCount
    };
  }
};

export const addDisclosure = {
  schema: AddDisclosureInput,
  handler: async ({ draftId, affiliateLinks }: { draftId: string; affiliateLinks?: string[] }) => {
    const draft = await getDraft(draftId);
    if (!draft) {
      return { updated: false };
    }

    const disclosure = `> **Disclosure:** This post may contain affiliate links. If you make a purchase through these links, we may earn a commission at no additional cost to you.

`;

    const updatedMetadata = {
      ...draft.metadata,
      affiliateLinks: affiliateLinks || []
    };

    const updatedContent = disclosure + draft.content;

    const locations = ['pending', 'approved'];
    for (const loc of locations) {
      try {
        const filePath = path.join(DRAFTS_PATH, loc, `${draftId}.mdx`);
        const fullContent = `---
${Object.entries(updatedMetadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}
---

${updatedContent}`;

        await fs.writeFile(filePath, fullContent, 'utf-8');
        return { updated: true };
      } catch {
        continue;
      }
    }

    return { updated: false };
  }
};
