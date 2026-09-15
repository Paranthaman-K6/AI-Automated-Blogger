# MASTER_PROMPT.md — Automated Blogger Architecture Source-of-Truth

> The automated-blogger MCP server is a DETERMINISTIC content-pipeline
> backend. It makes ZERO direct LLM calls and holds NO API keys.
> All intelligence (generation, abstractive summarization, JS rendering)
> is delegated to connected MCPs, chiefly omniroute-mcp.

## 1. System Goal

Run a multi-agent newsroom that researches, writes, fact-checks, and
publishes blog posts while respecting robots.txt, FTC disclosure rules,
copyright originality, and Vercel free-tier limits. OpenCode agents
orchestrate; MCP tools execute; the dashboard gates human approval;
batched commits deploy to a static Astro blog.

## 2. Component Map

| Component | Location | Role |
|---|---|---|
| MCP server | `mcp-server/dist/index.js` (stdio) | 10 deterministic pipeline tools |
| Dashboard | `dashboard/` → http://localhost:3210 | Draft queue, approval, batch publish, quota |
| Astro blog | `blog/` | Static MDX site, <90s builds |
| Drafts store | `drafts/{pending,approved,rejected,published}/` | File-backed draft lifecycle |
| Documents | `documents/` | Reference material |
| Agent prompts | `opencode-config/agents/` (7) | orchestrator, scout, analyst, writer, fact-checker, compliance, publisher |
| Skill defs | `opencode-config/skills/` (5) | blog-orchestrate, blog-scrape, blog-write, blog-compliance, blog-publish |
| Connected smart MCP | `omniroute-mcp` | `omniroute_route_request`, `omniroute_web_fetch` |

## 3. MCP Tool Table (automated-blogger)

DETERMINISTIC = pure local logic, no LLM. DELEGATED = server persists or
structurally assists; the smart part lives in the named connected MCP.

| # | Tool | Class | Smart owner (if DELEGATED) |
|---|---|---|---|
| 1 | `check_robots` | DETERMINISTIC | — (robots.txt gate, local fetch) |
| 2 | `scrape_source` | DETERMINISTIC fallback | `omniroute-mcp / omniroute_web_fetch` owns JS-heavy pages |
| 3 | `search_sources` | DETERMINISTIC | — (HackerNews API search) |
| 4 | `summarize_article` | DETERMINISTIC fallback | `omniroute-mcp / omniroute_route_request` owns abstractive analysis |
| 5 | `draft_post` | DETERMINISTIC persist | `omniroute-mcp / omniroute_route_request` owns body generation (`content`) |
| 6 | `add_disclosure` | DETERMINISTIC | — (template disclosure insertion) |
| 7 | `check_ftc` | DETERMINISTIC | — (rule-based compliance validator) |
| 8 | `check_copyright` | DETERMINISTIC | — (originality / overlap checks) |
| 9 | `commit_draft` | DETERMINISTIC | — (git batch file operations) |
| 10 | `deploy_vercel` | DETERMINISTIC | — (deploy trigger + quota tracking) |

Rules:

- NEVER call `draft_post` with `research` alone expecting prose back.
  ALWAYS generate `content` first via `omniroute_route_request`.
- NEVER call `summarize_article` expecting abstractive insight; pass
  `summary`/`facts`/`quotes` produced via `omniroute_route_request`.
- NEVER use `scrape_source` for JS-heavy pages; prefer
  `omniroute_web_fetch`, falling back to `scrape_source` (robots-gated).

## 4. Agent Delegation Flow

```text
User → @orchestrator → @scout → @analyst → @writer → @fact-checker → @compliance → @publisher
                            │           │          │                │               │
                     search_sources  summarize  route_request  check_copyright  check_ftc
                     scrape_source   +route_    +draft_post    scrape_source    add_disclosure
                                     request    (content)                      commit_draft
                                                                              deploy_vercel
```

1. **Scout**: `search_sources` (hn) → `check_robots` → `scrape_source`
   (or `omniroute_web_fetch` for JS-heavy).
2. **Analyst**: `summarize_article` with facts/quotes; abstractive pass
   via `omniroute_route_request` first when nuance matters.
3. **Writer (two-step, mandatory)**:
   a. `omniroute_route_request` with research facts → markdown body.
   b. `draft_post` with `title` + `research[{url,summary,facts,quotes}]`
      + `content` + `voice` → `draftId` in `drafts/pending/`.
4. **Fact-checker**: re-scrape claims, `check_copyright`.
5. **Compliance**: `check_ftc`, `add_disclosure` for affiliate links.
6. **Publisher (post-approval only)**: `commit_draft` → dashboard
   "Publish Batch" → `deploy_vercel` → preview URL.

Human approval in the dashboard (Pending → Approved) is REQUIRED before
`commit_draft` / `deploy_vercel`.

## 5. Vercel Free-Tier Batching Rules

- Max 10 posts per deploy batch.
- Max ~3 deploys/day (keeps 97% headroom on the 100/day quota).
- Local quota counter; warn at 95/100 deploys; resets midnight UTC.
- `deploy_vercel` defaults: `localPreviewFirst: false`,
  `skipPreview: false` — set `localPreviewFirst: true` to verify the
  Astro build (<90s target, esbuild, static output) before spending quota.
- Never deploy single drafts in a loop; always batch approved drafts
  under one `batchId`.

## 6. Env Contract

automated-blogger server env (in `~/.config/opencode/opencode.jsonc`
`automated-blogger` entry AND `mcp-server/.env`):

- REQUIRED: `DRAFTS_PATH`, `BLOG_REPO_PATH`, `DOCUMENTS_PATH`.
- REQUIRED: `NODE_ENV` (development/production).
- Dashboard extras in `.env`: `DASHBOARD_URL`, `DASHBOARD_PORT`,
  `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`.
- FORBIDDEN in automated-blogger: any `OMNIROUTE_*` key, any
  `PLAYWRIGHT_*` key, any LLM API key. The server has no direct
  OmniRoute client and no browser binaries.
- The `omniroute-mcp` entry in opencode.jsonc keeps its OWN API key
  — do not touch that entry when editing automated-blogger config.

## 7. Model Routing Policy

- No pinned models anywhere in automated-blogger config or docs.
- All LLM work goes through omniroute-mcp `omniroute_route_request`
  with automatic best-model routing.
- Changing models = reconfiguring omniroute-mcp or OmniRoute server,
  never automated-blogger.

## 8. Definition of Done (docs/config change)

- `opencode.jsonc` parses (balanced braces) and automated-blogger env
  holds exactly the REQUIRED keys above.
- Zero banned strings in README.md, STATUS.md, QUICKSTART.md,
  MASTER_PROMPT.md (no pinned model names, no server-side LLM keys,
  no browser-path keys).
- Every `draft_post` doc example shows the two-step flow with `content`.
