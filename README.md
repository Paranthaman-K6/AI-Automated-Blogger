# Automated Blogger - AI-Powered Content Automation System

Multi-agent newsroom automation system that researches, writes, fact-checks, and publishes blog posts using OpenCode + OmniRoute.

## Quick Start (10 Steps)

### 1. Clone & Install
```bash
cd ~/Projects/automated-blogger
npm install --workspaces
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys (already configured)
```

### 3. Install Playwright Browsers
```bash
cd mcp-server && npx playwright install chromium
```

### 4. Start Dashboard
```bash
cd dashboard && npm start
# Opens on http://localhost:3210
```

### 5. Configure OpenCode MCP
Add to `~/.config/opencode/opencode.jsonc`:
```json
{
  "mcp": {
    "automated-blogger": {
      "type": "local",
      "command": ["node", "/home/paranthaman/Projects/automated-blogger/mcp-server/dist/index.js"],
      "enabled": true,
      "env": {
        "DRAFTS_PATH": "/home/paranthaman/Projects/automated-blogger/drafts",
        "BLOG_REPO_PATH": "/home/paranthaman/Projects/automated-blogger/blog",
        "DOCUMENTS_PATH": "/home/paranthaman/Projects/automated-blogger/documents",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### 6. Test MCP Server
```bash
opencode --chat
> list available tools
# Should show automated_blogger_* tools
```

### 7. Create First Blog Post
```bash
opencode --chat
> @orchestrator write a blog post about "Getting Started with OpenCode MCP"
```

### 8. Review Draft
- Open http://localhost:3210
- See draft in Pending queue
- Click "Approve"

### 9. Batch Publish to Vercel
- Click "Publish Batch" button in dashboard
- Monitor deployment status

### 10. Verify Deployment
- Check preview URL returned by publisher
- Verify post appears on your Vercel blog

## Architecture

```
User (OpenCode) → @orchestrator → Subagents → MCP Tools → Dashboard → Vercel
                      ↓
    [Scout → Analyst → Writer → Fact-Checker → Compliance → Publisher]
```

## Components

### MCP Server (10 Tools)
- `check_robots` - Robots.txt compliance checker
- `scrape_source` - Playwright web scraper
- `search_sources` - HackerNews API search
- `summarize_article` - Research structurer (extractive fallback; abstractive via omniroute-mcp)
- `draft_post` - MDX draft persister (body via omniroute-mcp)
- `add_disclosure` - FTC affiliate disclosure
- `check_ftc` - Compliance validator
- `check_copyright` - Plagiarism detector
- `commit_draft` - Git batch operations
- `deploy_vercel` - Free tier deployment

### Dashboard (localhost:3210)
- Draft Queue (Pending/Approved/Rejected/Published)
- Batch Publishing Panel
- Vercel Quota Tracker (100 deploys/day)
- Deployment History

### Astro Blog
- Static site generator
- <90s build time (Vercel free tier optimized)
- MDX content collections
- Automatic sitemap generation
- Blog features: Related posts (tag-overlap, pure static), tag index pages, table of contents, reading time, tags, sources, affiliate disclosure, newsletter CTA

### Agents (7)
- @orchestrator - Workflow coordinator
- @scout - Source discovery
- @analyst - Fact extraction
- @writer - Content generation
- @fact-checker - Verification
- @compliance - FTC/copyright
- @publisher - Deployment

## Vercel Free Tier Optimizations

- **Batch Publishing**: Max 10 posts per deploy
- **Quota Tracking**: Local counter (100/day limit)
- **Warning System**: Alert at 95/100 deploys
- **Build Optimization**: esbuild minification, static output

## Models Used (OmniRoute)

LLM routing is handled by the connected omniroute-mcp `omniroute_route_request` (automatic best-model routing); the automated-blogger server makes zero direct LLM calls and needs no API keys.

## Directory Structure

```
automated-blogger/
├── mcp-server/          # MCP tools and services
│   ├── src/
│   │   ├── tools/       # 10 MCP tools
│   │   ├── services/    # Playwright, OmniRoute, Memory
│   │   └── types/       # Zod schemas
│   └── dist/            # Compiled JavaScript
├── dashboard/           # Express + Vanilla JS UI
│   ├── routes/          # API endpoints
│   ├── public/          # HTML/CSS/JS frontend
│   └── server.js
├── blog/                # Astro blog
│   ├── src/
│   │   ├── content/     # Blog posts (MDX)
│   │   ├── components/  # Astro components
│   │   └── layouts/
│   └── dist/            # Built site
├── drafts/              # Draft storage
│   ├── pending/
│   ├── approved/
│   ├── rejected/
│   └── published/
└── opencode-config/     # Agent prompts and skills
    ├── agents/
    └── skills/
```

## Development

### Start Dashboard
```bash
cd dashboard && npm start
```

### Build MCP Server
```bash
cd mcp-server && npm run build
```

### Build Blog Locally
```bash
cd blog && npm run build && npm run preview
```

### Test Individual Tool
```bash
opencode --chat
> use automated_blogger_check_robots with url="https://news.ycombinator.com"
```

## Troubleshooting

### Dashboard won't start
- Check if port 3210 is in use: `lsof -ti:3210`
- Kill process: `lsof -ti:3210 | xargs kill`

### MCP tools not showing
- Verify opencode.jsonc configuration
- Check MCP server builds: `cd mcp-server && npm run build`
- Restart OpenCode

### Vercel quota exceeded
- Check remaining: Visit dashboard at http://localhost:3210
- Quota resets at midnight UTC
- Reduce batch size or wait for reset

### Build time >90s
- Verify Astro config uses esbuild
- Check blog post count (>100 posts may slow builds)
- Run `cd blog && npm run build -- --verbose` for diagnostics

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding:
- New MCP tools
- Additional content sources
- Custom agents
- Dashboard features

## License

MIT

## Support

- GitHub Issues: [Report bugs](https://github.com/Paranthaman-K6/automated-blogger/issues)
- Email: paranthaman609@gmail.com
- OpenCode Docs: https://opencode.ai

---

**Status**: ✅ All components operational
**Last Updated**: 2026-09-14
**Author**: Paranthaman