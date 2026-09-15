import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';
import { checkRobots, scrapeSource } from './tools/scraping.js';
import { searchSources, summarizeArticle } from './tools/research.js';
import { draftPost, addDisclosure } from './tools/drafting.js';
import { checkFTC, checkCopyright } from './tools/compliance.js';
import { commitDraft, deployVercel } from './tools/publishing.js';

const server = new Server(
  { name: 'automated-blogger', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const tools = [
  {
    name: 'check_robots',
    description: 'Check if a URL allows scraping via robots.txt',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' }
      },
      required: ['url']
    },
    handler: checkRobots.handler
  },
  {
    name: 'scrape_source',
    description: 'Fallback page fetcher (plain HTTP + robots.txt gate). Prefer the connected omniroute-mcp `omniroute_web_fetch` for JS-heavy pages.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        selector: { type: 'string' },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['url']
    },
    handler: scrapeSource.handler
  },
  {
    name: 'search_sources',
    description: 'Search for articles from configured sources',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        sources: { type: 'array', items: { type: 'string', enum: ['hn'] }, default: ['hn'] }
      },
      required: ['query']
    },
    handler: searchSources.handler
  },
  {
    name: 'summarize_article',
    description: 'Structure research notes (extractive fallback). For abstractive analysis use connected omniroute-mcp `omniroute_route_request`, then re-call with summary/facts/quotes.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        url: { type: 'string', format: 'uri' },
        summary: { type: 'string' },
        facts: { type: 'array', items: { type: 'string' } },
        quotes: { type: 'array', items: { type: 'string' } }
      },
      required: ['content', 'url']
    },
    handler: summarizeArticle.handler
  },
  {
    name: 'draft_post',
    description: 'Persist article body as MDX draft. Generate the body first with connected omniroute-mcp `omniroute_route_request`, then call with `content`.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        research: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              summary: { type: 'string' },
              facts: { type: 'array', items: { type: 'string' } },
              quotes: { type: 'array', items: { type: 'string' } }
            },
            required: ['url', 'summary']
          }
        },
        voice: { type: 'string', default: 'professional' },
        content: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        sources: { type: 'array', items: { type: 'string' } }
      },
      required: ['title', 'research']
    },
    handler: draftPost.handler
  },
  {
    name: 'add_disclosure',
    description: 'Add FTC disclosure to a draft',
    inputSchema: {
      type: 'object',
      properties: {
        draftId: { type: 'string' },
        affiliateLinks: { type: 'array', items: { type: 'string' }, default: [] }
      },
      required: ['draftId']
    },
    handler: addDisclosure.handler
  },
  {
    name: 'check_ftc',
    description: 'Check FTC compliance for a draft',
    inputSchema: {
      type: 'object',
      properties: {
        draftId: { type: 'string' }
      },
      required: ['draftId']
    },
    handler: checkFTC.handler
  },
  {
    name: 'check_copyright',
    description: 'Check copyright compliance and originality',
    inputSchema: {
      type: 'object',
      properties: {
        draftId: { type: 'string' }
      },
      required: ['draftId']
    },
    handler: checkCopyright.handler
  },
  {
    name: 'commit_draft',
    description: 'Commit approved drafts to blog repository',
    inputSchema: {
      type: 'object',
      properties: {
        draftIds: { type: 'array', items: { type: 'string' } },
        batchId: { type: 'string' }
      },
      required: ['draftIds', 'batchId']
    },
    handler: commitDraft.handler
  },
  {
    name: 'deploy_vercel',
    description: 'Deploy blog to Vercel',
    inputSchema: {
      type: 'object',
      properties: {
        batchId: { type: 'string' },
        localPreviewFirst: { type: 'boolean', default: false },
        skipPreview: { type: 'boolean', default: false }
      },
      required: ['batchId']
    },
    handler: deployVercel.handler
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ handler, ...tool }) => tool)
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name);
  
  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  try {
    const result = await tool.handler(request.params.arguments as any ?? {});
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }) 
      }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Automated Blogger MCP running on stdio');
}

main().catch(console.error);
