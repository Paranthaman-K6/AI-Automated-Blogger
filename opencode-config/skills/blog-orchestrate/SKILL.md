---
name: blog-orchestrate
description: Master workflow orchestration skill for automated blog pipeline. Use when coordinating the full blog creation process from source discovery through publication, managing state transitions, quality gates, and error handling across all pipeline stages.
---

# Blog Orchestrate Skill

Master workflow instructions for coordinating the automated blogging pipeline.

## Tool Routing: Connected-MCP-First (Mandatory)

- **LLM generation/analysis/summarization: ONLY via connected omniroute-mcp `omniroute_route_request`** (automatic best-model routing; hint `auto/best-free`). NEVER use direct OmniRoute API keys, base URLs, or pinned model names.
- **Web discovery/fetch: primary = `omniroute_web_search` + `omniroute_web_fetch`** (Firecrawl/Jina/Tavily failover). `check_robots` gates ALL scraping. `scrape_source` is offline fallback only (plain HTTP, no JS); `search_sources` (HN API) allowed for HackerNews.
- **automated-blogger MCP tools are deterministic infrastructure only:** `check_robots`, `scrape_source` (fallback), `search_sources` (HN API), `summarize_article` (structure/validate research; accepts summary/facts/quotes passthrough — never a substitute for `omniroute_route_request`), `draft_post` (REQUIRES `content` — persist MDX only), `add_disclosure`, `check_ftc`, `check_copyright`, `commit_draft`, `deploy_vercel` (git push triggers Vercel).
- **Phase tool mapping:** SCOUT → `omniroute_web_search`/`omniroute_web_fetch` (+ `check_robots` gate); ANALYST → `omniroute_route_request` then `summarize_article` to structure/validate; WRITER → `omniroute_route_request` then `draft_post` with `content`; FACT-CHECKER → `omniroute_web_search`/`omniroute_web_fetch` cross-reference; COMPLIANCE → `add_disclosure`/`check_ftc`/`check_copyright`; PUBLISHER → `commit_draft` + `deploy_vercel`, monitor via composio Vercel tools, quota in dashboard (max 3 deploys/day, batch).

## Pipeline State Machine

```
┌──────────┐
│  IDLE    │
└────┬─────┘
     │ trigger
     ▼
┌──────────┐
│  SCOUT   │──→ Discover sources, check robots.txt
└────┬─────┘
     │ sources found
     ▼
┌──────────┐
│ ANALYST  │──→ Extract facts, build outline
└────┬─────┘
     │ outline ready
     ▼
┌──────────┐
│ WRITER   │──→ Draft 800-1500 word post
└────┬─────┘
     │ draft complete
     ▼
┌───────────────┐
│ FACT-CHECKER  │──→ Verify all claims
└───────┬───────┘
        │ verified
        ▼
┌──────────────┐
│ COMPLIANCE   │──→ Check FTC, copyright
└──────┬───────┘
       │ approved
       ▼
┌──────────────┐
│ DASHBOARD    │──→ Update status UI
└──────┬───────┘
       │ logged
       ▼
┌──────────────┐
│ PUBLISHER    │──→ Batch commit, deploy
└──────┬───────┘
       │ deployed
       ▼
┌──────────────┐
│ MONITOR      │──→ Track deployment
└──────┬───────┘
       │ verified
       ▼
┌──────────┐
│  IDLE    │
└──────────┘
```

## State Transitions

### Valid Transitions

```
IDLE → SCOUT
SCOUT → ANALYST (if ≥3 sources found)
SCOUT → ERROR (if no sources or robots.txt blocked)

ANALYST → WRITER (if outline structured)
ANALYST → SCOUT (if gaps require more sources)
ANALYST → ERROR (if no coherent narrative)

WRITER → FACT-CHECKER (if 800+ words drafted)
WRITER → ANALYST (if outline needs revision)
WRITER → ERROR (if unwritable topic)

FACT-CHECKER → COMPLIANCE (if ≥90% verified)
FACT-CHECKER → WRITER (if corrections needed)
FACT-CHECKER → ERROR (if <75% verified)

COMPLIANCE → DASHBOARD (if all checks passed)
COMPLIANCE → WRITER (if needs revision)
COMPLIANCE → ERROR (if legal risk)

DASHBOARD → PUBLISHER (if quota available)
DASHBOARD → QUEUED (if quota exceeded)

PUBLISHER → MONITOR (if deployed)
PUBLISHER → ERROR (if build failed)

MONITOR → IDLE (if verified live)
MONITOR → ERROR (if deployment failed)

ERROR → SCOUT (if recoverable)
ERROR → IDLE (if fatal)
```

### State Persistence

Store current state in OmniRoute memory:

```javascript
{
  "type": "procedural",
  "key": "pipeline_state",
  "content": {
    "current_phase": "writer",
    "topic": "TypeScript 5.7 release features",
    "started_at": "2026-09-14T16:00:00Z",
    "artifacts": {
      "sources": ["url1", "url2", "url3"],
      "outline": "/path/to/outline.json",
      "draft": "/path/to/draft.md"
    },
    "retry_count": 0,
    "next_phase": "fact-checker"
  }
}
```

## Quality Gates

Each transition requires passing criteria:

### SCOUT → ANALYST
- [ ] Found ≥3 valid sources
- [ ] All sources allow scraping (robots.txt)
- [ ] Trending score >60
- [ ] Topic not recently covered (<30 days)

### ANALYST → WRITER
- [ ] Outline has 3-5 main sections
- [ ] ≥5 verifiable facts extracted
- [ ] Clear narrative structure
- [ ] No critical knowledge gaps

### WRITER → FACT-CHECKER
- [ ] 800-1500 word count
- [ ] Valid YAML frontmatter
- [ ] All sections present
- [ ] ≥5 inline citations
- [ ] FTC disclosure if needed

### FACT-CHECKER → COMPLIANCE
- [ ] ≥90% claims verified
- [ ] All corrections applied
- [ ] All links functional
- [ ] Sources Tier 1 or Tier 2

### COMPLIANCE → PUBLISHER
- [ ] FTC compliance passed
- [ ] Copyright compliance passed
- [ ] Originality ≥70%
- [ ] Legal risk: Low
- [ ] Vercel quota available

### PUBLISHER → MONITOR
- [ ] Git commit succeeded
- [ ] Push completed
- [ ] Vercel build started
- [ ] Quota counter updated

### MONITOR → IDLE
- [ ] Deployment status: READY
- [ ] URL accessible
- [ ] Images loading
- [ ] RSS/sitemap updated

## Error Handling

### Retry Strategy

Transient errors (network, API limits):
```
Attempt 1: Immediate retry
Attempt 2: Wait 2 seconds
Attempt 3: Wait 5 seconds
After 3 failures: Escalate to ERROR state
```

### Backoff Algorithm

```javascript
const retryDelay = (attempt) => {
  return Math.min(1000 * Math.pow(2, attempt), 10000);
};
```

### Error Recovery

For each error type:

**Source discovery failed:**
- Action: Expand search to more platforms
- Fallback: Use previously successful topics
- Escalation: Human picks topic manually

**Fact verification failed (<75%):**
- Action: Mark as opinion piece, reduce claims
- Fallback: Request additional sources
- Escalation: Abandon topic if unverifiable

**Build failed:**
- Action: Fix syntax errors, retry build
- Fallback: Revert to last working commit
- Escalation: Manual review of build logs

**Quota exceeded:**
- Action: Queue post for next deployment window
- Fallback: N/A (hard limit)
- Escalation: Notify about quota status

### Error State Storage

```javascript
{
  "type": "episodic",
  "key": "error_<timestamp>",
  "content": {
    "phase": "writer",
    "error_type": "word_count_low",
    "message": "Draft only 654 words, minimum 800 required",
    "retry_count": 2,
    "recovery_action": "extend_content",
    "escalated": false
  }
}
```

## Coordination Commands

### Start Pipeline

```bash
# Trigger new blog post creation
@orchestrator start-pipeline --topic "trending"
```

### Resume Pipeline

```bash
# Resume from saved state
@orchestrator resume-pipeline --state-key "pipeline_state"
```

### Force Transition

```bash
# Skip to specific phase (use with caution)
@orchestrator jump-to --phase "publisher" --draft "/path/to/draft.md"
```

### Emergency Stop

```bash
# Halt pipeline and save state
@orchestrator emergency-stop --reason "critical_error"
```

## Monitoring Dashboard

Track these metrics:

```javascript
{
  "pipeline_stats": {
    "posts_completed_today": 2,
    "posts_in_progress": 1,
    "posts_queued": 0,
    "average_time_per_post": "45 minutes",
    "success_rate_7d": 0.85,
    "current_phase_durations": {
      "scout": "3m",
      "analyst": "5m",
      "writer": "18m",
      "fact_checker": "7m",
      "compliance": "4m",
      "publisher": "2m",
      "monitor": "1m"
    }
  },
  "quota_status": {
    "vercel_deploys_today": 2,
    "vercel_deploys_remaining": 1,
    "next_reset": "2026-09-15T00:00:00Z"
  },
  "error_summary": {
    "last_24h": 3,
    "types": {
      "fact_check_failed": 1,
      "quota_exceeded": 1,
      "source_blocked": 1
    }
  }
}
```

## Best Practices

1. **Always check state before transitions** - Verify prerequisites met
2. **Store artifacts incrementally** - Don't lose progress on errors
3. **Update dashboard frequently** - Every state transition
4. **Respect quality gates** - Don't skip verification steps
5. **Monitor quota religiously** - Check before every deploy
6. **Log all errors with context** - Include phase, retry count, inputs
7. **Keep state recoverable** - Save enough info to resume
8. **Batch deploys when possible** - Optimize free tier usage

## Integration Points

### With Agents

```javascript
// Delegate to specialist agents
const result = await callAgent('@scout', {
  action: 'discover_sources',
  platforms: ['hackernews', 'reddit', 'dev.to'],
  min_sources: 3
});

// Check result and transition
if (result.sources.length >= 3) {
  transitionTo('analyst', { sources: result.sources });
} else {
  transitionTo('error', { reason: 'insufficient_sources' });
}
```

### With Memory

```javascript
// Store phase completion
await omniroute.memory.add({
  type: 'episodic',
  key: `phase_${phase}_${timestamp}`,
  content: phaseResult,
  metadata: { duration, success: true }
});

// Retrieve previous state
const state = await omniroute.memory.search({
  query: 'pipeline_state',
  type: 'procedural',
  limit: 1
});
```

### With Dashboard

```javascript
// Update status
await fetch('http://localhost:3210/api/status', {
  method: 'POST',
  body: JSON.stringify({
    phase: 'writer',
    progress: 0.45,
    eta: '15 minutes',
    current_task: 'Drafting main content sections'
  })
});
```

## Workflow Execution Example

```javascript
// Full pipeline run
async function executePipeline(trigger = 'scheduled') {
  try {
    // 1. Scout
    const sources = await runPhase('scout', {
      platforms: ['hackernews', 'reddit'],
      trending_threshold: 60
    });
    
    // 2. Analyst
    const research = await runPhase('analyst', {
      sources: sources.urls,
      target_facts: 5,
      outline_sections: 4
    });
    
    // 3. Writer
    const draft = await runPhase('writer', {
      outline: research.outline,
      target_words: 1200,
      tone: 'technical_accessible'
    });
    
    // 4. Fact-Checker
    const verification = await runPhase('fact-checker', {
      draft: draft.file_path,
      min_verification: 0.90
    });
    
    // 5. Compliance
    const compliance = await runPhase('compliance', {
      draft: draft.file_path,
      min_originality: 0.70
    });
    
    // 6. Publisher
    const deployment = await runPhase('publisher', {
      draft: draft.file_path,
      check_quota: true,
      batch: true
    });
    
    // 7. Monitor
    const status = await runPhase('monitor', {
      deployment_id: deployment.vercel_id,
      timeout: 300
    });
    
    return { success: true, url: status.url };
    
  } catch (error) {
    await handleError(error);
    return { success: false, error };
  }
}
```

## Testing & Validation

Before production use:

1. **Dry run mode** - Execute pipeline without publishing
2. **Mock sources** - Test with known-good content
3. **Quota simulation** - Test queue behavior when limit hit
4. **Error injection** - Verify recovery mechanisms
5. **State recovery** - Test resume from each phase

## Troubleshooting

### Pipeline Stuck

```bash
# Check current state
@orchestrator get-state

# Force completion of phase
@orchestrator complete-phase --phase "writer" --force

# Reset to previous phase
@orchestrator rollback --to "analyst"
```

### Quality Gate Failing

```bash
# Override gate (with justification)
@orchestrator override-gate --phase "fact-checker" --reason "manual_verification_complete"

# Lower threshold temporarily
@orchestrator adjust-threshold --gate "originality" --value 0.65
```

### Memory Corruption

```bash
# Clear corrupted state
@orchestrator clear-state --confirm

# Restore from backup
@orchestrator restore-state --timestamp "2026-09-14T16:00:00Z"
```
