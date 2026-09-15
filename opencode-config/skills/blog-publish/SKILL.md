---
name: blog-publish
description: Publication skill for git commits, batching strategy, local preview checks, and Vercel free-tier deployment. Use when deploying blog posts, managing Vercel quota, batching commits, or verifying deployments.
---

# Blog Publish Skill

Deployment guidelines for publishing blog content to Vercel on the free tier.

## Tool Routing: Connected-MCP-First (Mandatory)

- **Persist/deploy via automated-blogger deterministic tools:** `commit_draft` (stage approved MDX), then `deploy_vercel` (git push triggers Vercel). The git/CLI commands below are the manual equivalent, not a replacement.
- **Deploy monitoring via connected composio Vercel tools** (deployment status, build logs); **quota tracked in dashboard** (mirror of the OmniRoute memory counters below).
- **Vercel free-tier batching is mandatory: max 3 deploys/day** (09:00, 14:00, 20:00 UTC windows). Batch multiple posts into one commit/deploy; if quota is exhausted, queue and stop.
- **Model routing:** `auto/best-free` via `omniroute_route_request` for any summarization. NEVER use direct OmniRoute API keys, base URLs, or pinned model names.

## Vercel Free Tier Limits

### Hard Limits (Cannot Exceed)

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| **Deployments** | 100/month | Hard block after 100 |
| **Daily deploys** | Recommended 3-5/day* | Soft (best practice) |
| **Build time** | 45 minutes max | Build canceled if exceeded |
| **Bandwidth** | 100GB/month | Soft warning |
| **Function invocations** | 100GB-hrs/month | Throttled after |
| **Edge requests** | Unlimited | No limit |
| **Team members** | 1 (hobby) | Enforced |

*Not technically limited, but recommended to avoid flags

### Quota Management

Store quota state in OmniRoute memory:

```javascript
{
  "type": "factual",
  "key": "vercel_quota_2026-09-14",
  "content": {
    "date": "2026-09-14",
    "deployments_today": 2,
    "deployments_this_month": 47,
    "monthly_limit": 100,
    "daily_recommended": 3,
    "next_reset_daily": "2026-09-15T00:00:00Z",
    "next_reset_monthly": "2026-10-01T00:00:00Z",
    "quota_status": "healthy"
  }
}
```

**Quota health states:**
- `healthy`: <60/100 monthly, <3/day today
- `warning`: 60-80/100 monthly, OR 3-4/day today
- `critical`: 80-95/100 monthly, OR 5+/day today
- `exceeded`: ≥95/100 monthly, OR build failed

### Quota Checking

Before EVERY deployment:

```javascript
async function checkQuota() {
  const quota = await omniroute.memory.search({
    query: 'vercel_quota',
    type: 'factual',
    limit: 1
  });
  
  const data = JSON.parse(quota[0].content);
  
  // Check daily limit
  if (data.deployments_today >= data.daily_recommended) {
    return {
      allowed: false,
      reason: 'daily_limit',
      message: `Already deployed ${data.deployments_today} times today (recommended max: ${data.daily_recommended})`,
      next_window: data.next_reset_daily
    };
  }
  
  // Check monthly limit
  const remaining = data.monthly_limit - data.deployments_this_month;
  if (remaining < 10) {
    return {
      allowed: false,
      reason: 'monthly_limit',
      message: `Only ${remaining} deployments left this month`,
      next_window: data.next_reset_monthly
    };
  }
  
  return {
    allowed: true,
    remaining_today: data.daily_recommended - data.deployments_today,
    remaining_month: remaining,
    status: data.quota_status
  };
}
```

## Batching Strategy

### When to Batch

**Batch multiple posts** into single deployment when:
- Multiple drafts ready simultaneously
- Non-urgent content
- Already at 2/3 daily deploys
- <20 monthly deploys remaining

**Single-post deployment** allowed when:
- Breaking news / time-sensitive
- Major bug fix / correction
- Quota healthy (<50/100 monthly, <2/day today)
- User explicitly requests immediate publish

### Batching Implementation

#### Queue Management

Store queued posts:

```javascript
{
  "type": "episodic",
  "key": "publish_queue",
  "content": {
    "queued_posts": [
      {
        "draft_file": "/path/to/draft1.md",
        "priority": "normal",
        "queued_at": "2026-09-14T15:00:00Z",
        "ready": true
      },
      {
        "draft_file": "/path/to/draft2.md",
        "priority": "high",
        "queued_at": "2026-09-14T16:30:00Z",
        "ready": true
      }
    ],
    "next_batch_time": "2026-09-14T20:00:00Z"
  }
}
```

#### Batch Scheduling

**Daily deployment windows:**
- **09:00 UTC** - Morning batch (overnight posts)
- **14:00 UTC** - Midday batch (morning posts)
- **20:00 UTC** - Evening batch (afternoon posts)

**Batch size:**
- Minimum: 2 posts
- Recommended: 3-4 posts
- Maximum: 6 posts (readability of commit)

#### Batch Execution

```bash
#!/bin/bash
# Batch publish multiple posts

BLOG_DIR="/home/paranthaman/Projects/automated-blogger/blog"
DRAFTS_DIR="/home/paranthaman/Projects/automated-blogger/drafts"

cd "$BLOG_DIR"

# Array of draft files
DRAFTS=(
  "2026-09-14-typescript-predicates.md"
  "2026-09-14-react-suspense.md"
  "2026-09-14-rust-async.md"
)

# Move all drafts to blog
for draft in "${DRAFTS[@]}"; do
  mv "$DRAFTS_DIR/$draft" "$BLOG_DIR/content/posts/"
  echo "✅ Staged: $draft"
done

# Move associated images (if any)
if [ -d "$DRAFTS_DIR/images" ]; then
  mv "$DRAFTS_DIR/images/"* "$BLOG_DIR/public/images/" 2>/dev/null
  echo "✅ Staged images"
fi

# Single commit for batch
git add content/posts/ public/images/

# Commit message with summary
git commit -m "feat: publish 3 new posts

- TypeScript 5.7 inferred type predicates (1,234 words, 7 sources)
- React 19 Suspense patterns (1,456 words, 5 sources)  
- Rust async runtime deep dive (1,678 words, 8 sources)

Deploy: 3/3 daily quota used
Batch: evening window (20:00 UTC)"

# Push to trigger deployment
git push origin main

echo "✅ Batch deployed - 3 posts published"
```

## Pre-Publish Checks

### Local Build Verification

**Always build locally before pushing:**

```bash
cd /home/paranthaman/Projects/automated-blogger/blog

# Clean build
rm -rf .next/ out/ dist/ public/.cache/ .cache/

# Install dependencies (if changed)
npm ci

# Run build
npm run build 2>&1 | tee build.log

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Build succeeded"
else
  echo "❌ Build failed - check build.log"
  exit 1
fi
```

**Common build errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `YAML parse error` | Invalid frontmatter | Check YAML syntax, quotes |
| `Cannot resolve module` | Missing dependency | `npm install [package]` |
| `Image not found` | Broken image path | Verify file exists, check path |
| `GraphQL error` | Invalid query | Check query against schema |
| `Memory exceeded` | Too many pages | Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"` |

### Local Preview

Run dev server to verify:

```bash
npm run dev

# Wait for server
sleep 5

# Open in browser (optional)
xdg-open http://localhost:3000

# Or test with curl
curl -I http://localhost:3000/posts/new-post-slug

# Expected: HTTP/1.1 200 OK
```

**Preview checklist:**
- [ ] Post renders at correct URL
- [ ] Frontmatter displays correctly
- [ ] Images load properly
- [ ] Code highlighting works
- [ ] Links are functional
- [ ] No console errors
- [ ] Mobile responsive (test viewport)
- [ ] SEO meta tags present

## Git Workflow

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New blog post
- `fix`: Correction or update to existing post
- `docs`: Documentation changes (README, etc.)
- `style`: Formatting, no content change
- `refactor`: Reorganize content
- `chore`: Maintenance (dependencies, config)

#### Examples

**Single post:**
```
feat(posts): add TypeScript 5.7 inferred type predicates guide

- Title: TypeScript 5.7: Automatic Type Predicates
- Word count: 1,234
- Sources: 7 (TypeScript blog, GitHub, docs)
- Tags: typescript, type-safety, dx
- FTC disclosure: N/A

Deploy: 2/3 daily quota used
```

**Batched posts:**
```
feat(posts): publish 3 new technical deep-dives

Posts included:
- TypeScript 5.7 inferred type predicates (1,234 words)
- React 19 Suspense and data fetching (1,456 words)
- Rust async runtime comparison (1,678 words)

All posts:
- Fact-checked (≥90% verified)
- Compliance approved (≥70% originality)
- Images licensed (Unsplash + original diagrams)

Deploy: 3/3 daily quota used (evening batch)
```

**Bug fix:**
```
fix(posts): correct React 18 release date

- Changed: March 2022 → March 29, 2022
- Source: Official React blog announcement
- Affected post: /posts/react-18-features
```

**Content update:**
```
fix(posts): update TypeScript guide for 5.8 release

- Added section on const type parameters
- Updated code examples for new syntax
- Refreshed performance benchmarks
- Added link to official migration guide
```

### Git Commands

```bash
cd /home/paranthaman/Projects/automated-blogger/blog

# Check current status
git status

# Stage specific file
git add content/posts/2026-09-14-post-slug.md

# Stage images (if any)
git add public/images/2026-09-14-*.{jpg,png,svg}

# Review staged changes
git diff --staged

# Commit with message
git commit -m "feat(posts): add [topic] guide

- Title: [Full Title]
- Word count: 1,234
- Sources: 7

Deploy: 2/3 daily quota used"

# Push to trigger deployment
git push origin main

# Verify push
git log -1 --oneline
```

### Branch Strategy

**For hobby/free tier (single developer):**
- Use `main` branch directly
- Vercel auto-deploys on push to `main`
- No feature branches needed (unless testing)

**For team environments:**
```bash
# Create feature branch
git checkout -b posts/2026-09-14-typescript-guide

# Work on post
# ... edit files ...

# Commit to feature branch
git add content/posts/2026-09-14-typescript-guide.md
git commit -m "feat: add TypeScript guide"

# Push feature branch (preview deployment)
git push origin posts/2026-09-14-typescript-guide

# Merge to main (production deployment)
git checkout main
git merge posts/2026-09-14-typescript-guide
git push origin main

# Delete feature branch
git branch -d posts/2026-09-14-typescript-guide
git push origin --delete posts/2026-09-14-typescript-guide
```

## Vercel Deployment

### Automatic Deployment

Vercel watches `main` branch:

1. You push commit to GitHub
2. Vercel detects push via webhook
3. Vercel clones repo
4. Vercel runs `npm run build` (or configured command)
5. Vercel deploys to production
6. Vercel sends deployment webhook

**Timeline:**
- Detection: ~5 seconds
- Clone: ~10 seconds
- Build: 30-180 seconds (depends on site size)
- Deploy: ~10 seconds
- **Total: ~1-3 minutes**

### Monitoring Deployment

#### Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Get latest deployment status
vercel ls /home/paranthaman/Projects/automated-blogger/blog --limit 1

# Watch deployment in real-time
vercel --prod --confirm
```

#### Via Vercel Dashboard

Open: https://vercel.com/[your-username]/[project-name]/deployments

Check:
- **Status**: QUEUED | BUILDING | READY | ERROR | CANCELED
- **Duration**: Build time
- **Logs**: Build output
- **Preview URL**: Temporary URL before production

#### Via OmniRoute Memory

Store deployment status:

```javascript
{
  "type": "episodic",
  "key": "deployment_2026-09-14T20:05:00",
  "content": {
    "deployment_id": "dpl_abc123xyz",
    "status": "building",
    "started_at": "2026-09-14T20:05:00Z",
    "git_commit": "a1b2c3d",
    "posts_included": [
      "2026-09-14-typescript-predicates.md",
      "2026-09-14-react-suspense.md",
      "2026-09-14-rust-async.md"
    ],
    "url": "https://yourblog.com",
    "preview_url": "https://blog-abc123.vercel.app"
  }
}
```

### Deployment States

| State | Meaning | Action |
|-------|---------|--------|
| **QUEUED** | Waiting to start | Monitor, normal |
| **INITIALIZING** | Setting up build | Monitor, normal |
| **BUILDING** | Running build | Monitor, normal (30-180s) |
| **READY** | ✅ Deployed successfully | Verify live URL |
| **ERROR** | ❌ Build failed | Check logs, fix, redeploy |
| **CANCELED** | Stopped manually | N/A |

### Post-Deployment Verification

After deployment reaches `READY`:

```bash
#!/bin/bash
# Verify deployment

BLOG_URL="https://yourblog.com"
POST_SLUG="2026-09-14-post-slug"

# 1. Check main site
echo "Checking main site..."
curl -I "$BLOG_URL" | grep "HTTP/2 200"

# 2. Check new post
echo "Checking new post..."
curl -I "$BLOG_URL/posts/$POST_SLUG" | grep "HTTP/2 200"

# 3. Check RSS feed updated
echo "Checking RSS..."
curl -s "$BLOG_URL/rss.xml" | grep "$POST_SLUG"

# 4. Check sitemap updated
echo "Checking sitemap..."
curl -s "$BLOG_URL/sitemap.xml" | grep "$POST_SLUG"

# 5. Check images load
echo "Checking images..."
curl -I "$BLOG_URL/images/$POST_SLUG-diagram.png" | grep "HTTP/2 200"

echo "✅ All checks passed"
```

**Verification checklist:**
- [ ] Main site returns 200 OK
- [ ] New post URL returns 200 OK
- [ ] Post content renders correctly
- [ ] Images load (check 1-2 key images)
- [ ] Code highlighting works
- [ ] RSS feed includes new post
- [ ] Sitemap includes new post
- [ ] Meta tags correct (view source)
- [ ] No console errors (check DevTools)

### Error Handling

#### Build Failures

If deployment status is `ERROR`:

1. **Check Vercel logs:**
```bash
vercel logs --prod
```

2. **Common errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Command "build" not found` | Missing script | Add `"build"` to package.json |
| `Module not found` | Missing dependency | `npm install [package]` and commit |
| `YAML parse error` | Invalid frontmatter | Fix YAML syntax in post |
| `Image not found` | Broken image path | Fix path or add missing image |
| `Memory limit exceeded` | Too many files | Increase memory in vercel.json |
| `Build timeout` | Build >45 minutes | Optimize build, split content |

3. **Fix locally:**
```bash
# Reproduce error
npm run build

# Fix the issue
# ... edit files ...

# Verify fix
npm run build

# Commit fix
git add [fixed-files]
git commit -m "fix: resolve build error - [description]"
git push origin main
```

4. **Rollback if needed:**
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or rollback in Vercel UI
vercel rollback [previous-deployment-url]
```

#### Quota Exceeded

If monthly limit hit (100 deploys):

**Immediate actions:**
1. Stop queuing new posts
2. Update status dashboard: quota exceeded
3. Calculate days until reset
4. Queue posts for next month

**Queue format:**
```javascript
{
  "type": "procedural",
  "key": "quota_exceeded_queue",
  "content": {
    "quota_exceeded_at": "2026-09-27T15:00:00Z",
    "next_reset": "2026-10-01T00:00:00Z",
    "queued_posts": [
      {
        "draft_file": "/path/to/draft1.md",
        "priority": "high",
        "target_date": "2026-10-01"
      },
      {
        "draft_file": "/path/to/draft2.md",
        "priority": "normal",
        "target_date": "2026-10-02"
      }
    ]
  }
}
```

**On 1st of month:**
1. Check quota reset (should be 0/100)
2. Deploy queued high-priority posts first
3. Resume normal publishing schedule

## Best Practices

### Do's ✅

- **Test locally** before every push
- **Batch posts** when quota is limited
- **Monitor quota** daily
- **Verify deployments** after they complete
- **Write clear commit messages** with post metadata
- **Keep build logs** for debugging
- **Track deployment times** to identify slow builds
- **Use preview deployments** for testing (feature branches)

### Don'ts ❌

- **Don't push untested builds** - always run locally first
- **Don't force push** to main - breaks deployment history
- **Don't ignore quota warnings** - plan batches ahead
- **Don't deploy late at night** - be available to fix issues
- **Don't skip verification** - always check live URL
- **Don't delete deployment logs** - keep for debugging
- **Don't bypass build checks** - respect errors

## Troubleshooting

### Build is Slow (>5 minutes)

**Diagnose:**
```bash
npm run build -- --profile

# Or with timing
time npm run build
```

**Common causes:**
- Too many images unoptimized
- Large dependencies (check bundle size)
- Expensive queries (GraphQL)
- Lack of caching

**Fixes:**
- Optimize images before adding (use WebP, compress)
- Use dynamic imports for code splitting
- Implement incremental builds (if supported)
- Enable Vercel build cache

### Deployment Shows Old Content

**Cache issue:**

1. **Hard refresh:** Ctrl+Shift+R
2. **Clear browser cache**
3. **Check Vercel edge cache:** May take 60 seconds to propagate
4. **Verify git commit** deployed:
```bash
curl -I https://yourblog.com | grep 'x-vercel-id'
```

### Quota Tracking Drift

If quota counter incorrect:

1. **Audit Vercel dashboard** deployments this month
2. **Recount manually:**
```bash
# Get deployments this month
vercel ls --prod | grep "$(date +%Y-%m)" | wc -l
```

3. **Update memory:**
```javascript
omniroute.memory.add({
  type: 'factual',
  key: 'vercel_quota_corrected',
  content: {
    date: new Date().toISOString().split('T')[0],
    deployments_this_month: [actual_count],
    source: 'manual_audit'
  }
});
```

## Deployment Checklist

Before every deploy:

- [ ] Local build successful (`npm run build`)
- [ ] Local preview verified (`npm run dev`)
- [ ] All images present and optimized
- [ ] Frontmatter valid YAML
- [ ] Links functional
- [ ] Quota check passed (<3 today, <90 monthly)
- [ ] Commit message descriptive
- [ ] Changes staged (`git add`)
- [ ] Ready to monitor deployment

After deployment:

- [ ] Deployment status: READY
- [ ] Live URL returns 200 OK
- [ ] Post content renders correctly
- [ ] Images load
- [ ] RSS/sitemap updated
- [ ] No console errors
- [ ] Quota counter updated
- [ ] Status dashboard updated
