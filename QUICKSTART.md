# ⚡ QUICKSTART: First Blog Post in 5 Minutes

**Current Status**: ✅ All systems operational  
**Dashboard**: http://localhost:3210  
**Time Required**: 5 minutes

---

## 🎯 Step-by-Step Guide

### Step 1: Restart OpenCode (30 seconds)

The MCP server configuration has been added to `~/.config/opencode/opencode.jsonc`.

**Close and restart OpenCode now** to load the automated-blogger MCP server.

---

### Step 2: Verify MCP Tools (30 seconds)

```bash
opencode --chat
> list available tools
```

**Expected Output**: You should see 10 new tools starting with `automated_blogger_`:
- automated_blogger_check_robots
- automated_blogger_scrape_source
- automated_blogger_search_sources
- automated_blogger_summarize_article
- automated_blogger_draft_post
- automated_blogger_add_disclosure
- automated_blogger_check_ftc
- automated_blogger_check_copyright
- automated_blogger_commit_draft
- automated_blogger_deploy_vercel

If you see these, ✅ MCP server is working!

---

### Step 3: Test Your First Tool (1 minute)

Let's test the robots.txt checker:

```bash
opencode --chat
> use automated_blogger_check_robots with url="https://news.ycombinator.com"
```

**Expected Response**:
```json
{
  "url": "https://news.ycombinator.com",
  "allowed": true
}
```

✅ If you see this, your MCP server is fully functional!

---

### Step 4: Search for Blog Post Ideas (1 minute)

Let's find trending topics on HackerNews:

```bash
> use automated_blogger_search_sources with query="artificial intelligence" and sources=["hn"]
```

**Expected Response**: A list of recent HackerNews posts about AI with titles, URLs, and summaries.

**Pick one interesting URL** from the results for the next step.

---

### Step 5: Scrape Content (1 minute)

Let's scrape one of the articles (replace URL with one from Step 4):

```bash
> use automated_blogger_scrape_source with url="https://news.ycombinator.com/item?id=XXXXXXXX"
```

**Expected Response**:
```json
{
  "content": "...article text...",
  "url": "https://...",
  "allowed": true
}
```

✅ You've successfully scraped content!

---

### Step 6: Generate Your First Draft (2 minutes)

Draft creation is a two-step flow. The automated-blogger server makes zero direct LLM calls — generate the body first, then persist it:

**Step 6a — Generate the article body via omniroute-mcp:**

```bash
> use omniroute_route_request with messages=[{"role":"user","content":"Write an 800-1500 word accessible blog post titled 'The Rise of AI Development Tools in 2026' using these facts: AI tools are becoming mainstream; Developers prefer AI-assisted coding"}]
```

Copy the returned markdown body for the next step.

**Step 6b — Persist the draft via automated-blogger:**

```bash
> use automated_blogger_draft_post with title="The Rise of AI Development Tools in 2026" and research=[{"url":"https://news.ycombinator.com","summary":"AI tools roundup","facts":["AI tools are becoming mainstream","Developers prefer AI-assisted coding"],"quotes":[]}] and content="<markdown body from step 6a>" and voice="accessible"
```

**Expected Response**:
```json
{
  "draftId": "draft-XXXXX",
  "path": "/home/paranthaman/Projects/automated-blogger/drafts/pending/draft-XXXXX.md",
  "wordCount": 1234
}
```

✅ Your first AI-generated blog post draft is created!

---

### Step 7: Review in Dashboard (30 seconds)

1. Open your browser: http://localhost:3210
2. You should see your draft in the "Pending Drafts" section
3. Click on the draft to preview it
4. Click **"Approve"** to move it to the batch publishing queue

---

### Step 8: Batch Publish (Optional - 1 minute)

If you want to test the full deployment:

1. In the dashboard, click **"Publish Batch to Vercel"**
2. The system will:
   - Commit the draft to Git
   - Deploy to Vercel
   - Return a preview URL

⚠️ **Note**: This uses 1 of your 100 daily Vercel deployments.

**For now**, you can skip this step and just verify the draft appears in the dashboard.

---

## 🎉 SUCCESS! You've completed the quickstart!

### What You've Accomplished:
- ✅ Verified MCP server is working
- ✅ Tested robots.txt compliance
- ✅ Searched HackerNews for topics
- ✅ Scraped article content
- ✅ Generated an AI-powered blog post draft
- ✅ Reviewed the draft in the dashboard
- ✅ (Optional) Published to Vercel

---

## 🚀 Next Steps

### Option A: Generate More Drafts
```bash
opencode --chat
> use automated_blogger_search_sources with query="YOUR_TOPIC" and sources=["hn"]
# Pick a URL from results
> use automated_blogger_scrape_source with url="URL_FROM_RESULTS"
# 1. Generate the body via omniroute-mcp
> use omniroute_route_request with messages=[{"role":"user","content":"Write a blog post about YOUR_TOPIC using the scraped facts..."}]
# 2. Persist via automated-blogger with `content`
> use automated_blogger_draft_post with title="YOUR_TITLE" and research=[{"url":"URL_FROM_RESULTS","summary":"...","facts":[...],"quotes":[]}] and content="<markdown body from previous step>" and voice="accessible"
```

### Option B: Use the Full Agent Workflow

Once you configure the agents (see `opencode-config/agents/`), you can use:

```bash
> @orchestrator write a blog post about "Getting Started with OpenCode MCP"
```

This will automatically:
1. Scout sources
2. Analyze content
3. Generate draft
4. Fact-check
5. Validate compliance
6. Present for approval

### Option C: Test Compliance Checkers

```bash
# Check FTC compliance
> use automated_blogger_check_ftc with draftId="draft-XXXXX"

# Check copyright/plagiarism
> use automated_blogger_check_copyright with draftId="draft-XXXXX"
```

---

## 📊 Your System Status

**Dashboard**: http://localhost:3210  
**Drafts Pending**: Check dashboard  
**Vercel Quota**: 100/100 remaining  
**Build Time**: 1.12s (98.7% under target)  

---

## 🆘 Troubleshooting

### Tools Not Showing?
1. Did you restart OpenCode? (Required!)
2. Check config: `cat ~/.config/opencode/opencode.jsonc | grep automated-blogger`
3. Test MCP server manually (no API keys needed — the server makes zero direct LLM calls):
    ```bash
    cd ~/Projects/automated-blogger/mcp-server
    DRAFTS_PATH=~/Projects/automated-blogger/drafts \
    BLOG_REPO_PATH=~/Projects/automated-blogger/blog \
    DOCUMENTS_PATH=~/Projects/automated-blogger/documents \
    node dist/index.js
    ```
   Should output: "Automated Blogger MCP running on stdio"

### Dashboard Not Working?
```bash
# Check if running
curl http://localhost:3210/api/health

# Restart if needed
cd ~/Projects/automated-blogger/dashboard
npm start
```

### Scraping Fails?
- Check robots.txt first with `check_robots`
- Verify URL is accessible
- Try a different source

---

## 📚 Documentation

- **Full Guide**: See `README.md`
- **System Status**: See `STATUS.md`
- **Agent Setup**: See `opencode-config/agents/`
- **API Reference**: See `dashboard/routes/` for endpoint implementations

---

**Enjoy automated blogging!** 🎉

If you have questions, check STATUS.md or README.md for detailed information.