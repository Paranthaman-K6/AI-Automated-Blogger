const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');

const DRAFTS_PATH = process.env.DRAFTS_PATH || '/home/paranthaman/Projects/automated-blogger/drafts';
const STATUSES = ['pending', 'approved', 'rejected', 'published'];

async function findDraft(id) {
  for (const status of STATUSES) {
    for (const ext of ['.md', '.mdx']) {
      const filePath = path.join(DRAFTS_PATH, status, `${id}${ext}`);
      try {
        await fs.access(filePath);
        return { filePath, status };
      } catch {
        // try next
      }
    }
  }
  return null;
}

function parseDraft(fileContent) {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  let metadata = {};
  let body = fileContent;
  if (match) {
    body = match[2] || '';
    for (const line of match[1].split('\n')) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const raw = line.substring(idx + 1).trim();
        try {
          metadata[key] = JSON.parse(raw);
        } catch {
          metadata[key] = raw.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  return { metadata, body };
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p;
    } catch { /* fall through */ }
    return v.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function extractToc(body) {
  const toc = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      const text = m[2].replace(/[*_`[\]()]/g, '').trim();
      if (text) toc.push({ depth: m[1].length, slug: slugify(text), text });
    }
  }
  return toc;
}

async function listAllDrafts() {
  const out = [];
  for (const status of STATUSES) {
    let files = [];
    try {
      files = await fs.readdir(path.join(DRAFTS_PATH, status));
    } catch {
      continue;
    }
    for (const file of files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'))) {
      try {
        const raw = await fs.readFile(path.join(DRAFTS_PATH, status, file), 'utf-8');
        const { metadata } = parseDraft(raw);
        out.push({ id: file.replace(/\.mdx?$/, ''), status, metadata });
      } catch {
        // skip unreadable files
      }
    }
  }
  return out;
}

function relatedDrafts(currentId, currentTags, all, count = 3) {
  const tags = new Set(currentTags.map(t => String(t).toLowerCase()));
  return all
    .filter(d => d.id !== currentId)
    .map(d => ({
      d,
      shared: asArray(d.metadata.tags).filter(t => tags.has(String(t).toLowerCase())).length,
      date: d.metadata.pubDate ? +new Date(d.metadata.pubDate) : 0
    }))
    .sort((a, b) => b.shared - a.shared || b.date - a.date)
    .slice(0, count)
    .map(x => x.d);
}

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const found = await findDraft(id);
    if (!found) return res.status(404).send('Draft not found');

    const fileContent = await fs.readFile(found.filePath, 'utf-8');
    const { metadata, body } = parseDraft(fileContent);

    const title = metadata.title || id;
    const description = metadata.description || '';
    const author = metadata.author || 'Automated Blogger';
    const tags = asArray(metadata.tags);
    const sources = asArray(metadata.sources);
    const affiliateLinks = asArray(metadata.affiliateLinks);

    let pubDateStr = '';
    if (metadata.pubDate) {
      const d = new Date(metadata.pubDate);
      if (!isNaN(d)) pubDateStr = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(d);
    }

    const htmlBody = marked.parse(body);
    const words = body.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(words / 200));
    const toc = extractToc(body);
    const tocHtml = toc.length > 1
      ? `<nav class="toc" aria-label="Table of contents"><p class="toc-title">On this page</p><ul>${toc.map(h => `<li class="toc-depth-${h.depth}"><a href="#${esc(h.slug)}">${esc(h.text)}</a></li>`).join('')}</ul></nav>`
      : '';

    const related = relatedDrafts(id, tags, await listAllDrafts(), 3);
    const relatedHtml = related.length
      ? `<div class="related-posts"><h3 class="sidebar-section-title">You may also like</h3><div class="related-list">${related.map(r => {
          const rt = (r.metadata && r.metadata.title) || r.id;
          const rd = (r.metadata && r.metadata.description) || '';
          return `<a class="related-card" href="/preview/${esc(r.id)}"><span class="related-title">${esc(String(rt))}</span><span class="related-desc">${esc(String(rd)).slice(0, 140)}</span><span class="related-meta">${esc(r.status)}</span></a>`;
        }).join('')}</div></div>`
      : '';

    const disclosure = affiliateLinks.length
      ? `<aside class="affiliate-disclosure"><div class="disclosure-badge">Disclosure</div><p>This post contains affiliate links. We may earn a commission at no extra cost to you.</p></aside>`
      : '';

    const tagsHtml = tags.length
      ? `<div class="tags-container">${tags.map(t => `<span class="tag">#${esc(typeof t === 'string' ? t : JSON.stringify(t))}</span>`).join('')}</div>`
      : '';

    const reviewBanner = found.status === 'pending'
      ? `<div class="review-banner"><span class="review-badge">PENDING REVIEW — ${words} words • ${readingTime} min read</span>
         <div class="review-actions">
           <button class="btn-approve" onclick="reviewAction('approve')">Approve</button>
           <button class="btn-reject" onclick="reviewAction('reject')">Reject</button>
         </div></div>
         <script>
           async function reviewAction(action) {
             let reason = '';
             if (action === 'reject') { reason = prompt('Rejection reason (optional):') || ''; }
             const r = await fetch('/api/drafts/${esc(id)}/' + action, {
               method: 'POST', headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ reason })
             });
             const data = await r.json();
             if (r.ok) { document.getElementById('reviewState').textContent = 'Draft ' + action + 'd ✓'; }
             else { alert(data.error || 'Action failed'); }
           }
         </script>`
      : `<div class="review-banner review-done"><span class="review-badge">STATUS: ${esc(found.status).toUpperCase()} — ${words} words • ${readingTime} min read</span><span id="reviewState"></span></div>`;

    res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${esc(description)}" />
<title>${esc(title)}</title>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{--max-w:1400px;--gap:1.5rem;--sidebar-l:220px;--sidebar-r:240px}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;color:#1e293b;background:#fff;line-height:1.6;display:flex;flex-direction:column;min-height:100vh}
.site-header{border-bottom:1px solid #e2e8f0;background:#fff;position:sticky;top:0;z-index:10}
.header-inner{width:100%;max-width:var(--max-w);margin:0 auto;padding:0 var(--gap);display:flex;justify-content:space-between;align-items:center;height:4rem}
.site-title{font-size:1.25rem;font-weight:700;color:#0f172a;text-decoration:none}
.site-nav a{color:#64748b;text-decoration:none;font-weight:500;margin-left:1.25rem}
.main-wrapper{width:100%;max-width:var(--max-w);margin:0 auto;padding:2.5rem var(--gap) 3.5rem}
.site-footer{border-top:1px solid #e2e8f0;padding:2rem 0;background:#f8fafc;color:#64748b;font-size:.875rem;text-align:center}
.footer-inner{max-width:var(--max-w);margin:0 auto;padding:0 var(--gap)}
.post-layout{display:grid;grid-template-columns:1fr;gap:2rem;align-items:start}
.sidebar-sticky{position:sticky;top:calc(4rem + 1.5rem);max-height:calc(100vh - 4rem - 3rem);overflow-y:auto;scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent}
.sidebar-sticky::-webkit-scrollbar{width:4px}
.sidebar-sticky::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
.post-header{margin-bottom:2rem}
.post-meta{font-size:.875rem;color:#64748b;margin-bottom:.5rem}
.meta-sep{margin:0 .5rem}
.post-title{font-size:2.25rem;line-height:1.25;font-weight:800;color:#0f172a;margin:.5rem 0 1rem}
.tags-container{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
.post-content{font-size:1.125rem;line-height:1.8;color:#334155}
.post-content h2{font-size:1.75rem;font-weight:700;color:#0f172a;margin-top:2.5rem;margin-bottom:1rem}
.post-content h3{font-size:1.35rem;font-weight:600;color:#0f172a;margin-top:2rem;margin-bottom:.75rem}
.post-content p{margin:1.25rem 0}
.post-content ul,.post-content ol{padding-left:1.5rem;margin:1.25rem 0}
.post-content li{margin:.5rem 0}
.post-content a{color:#2563eb;text-decoration:none;border-bottom:1px solid #bfdbfe}
.post-content a:hover{color:#1d4ed8;border-bottom-color:#1d4ed8}
.post-content code{background:#f1f5f9;padding:.2rem .4rem;border-radius:.25rem;font-size:.9em;font-family:monospace}
.post-content pre{background:#0f172a;color:#e2e8f0;padding:1.25rem;border-radius:.5rem;overflow-x:auto;margin:1.5rem 0}
.post-content pre code{background:transparent;padding:0;color:inherit}
.post-content blockquote{border-left:4px solid #6366f1;margin:1.5rem 0;padding:.5rem 0 .5rem 1.5rem;color:#475569;font-style:italic;background:#f8fafc;border-radius:0 .5rem .5rem 0}
.post-content img{max-width:100%;border-radius:.5rem}
.post-content table{width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:.95rem}
.post-content th,.post-content td{border:1px solid #e2e8f0;padding:.6rem .9rem;text-align:left}
.post-content th{background:#f8fafc;font-weight:600;color:#0f172a}
.post-content hr{border:none;border-top:1px solid #e2e8f0;margin:2.5rem 0}
.sources-section{margin-top:3rem;padding-top:1.5rem;border-top:1px solid #e2e8f0}
.sources-section h3{font-size:1.125rem;font-weight:700;margin-bottom:.75rem;color:#0f172a}
.sources-section ul{list-style-type:disc;padding-left:1.25rem}
.sources-section a{color:#2563eb;text-decoration:none}
.sources-section a:hover{text-decoration:underline}
.toc{background:#f8fafc;border:1px solid #e2e8f0;border-radius:.75rem;padding:1rem 1.25rem}
.toc-title{font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:0 0 .75rem}
.toc ul{list-style:none;margin:0;padding:0}
.toc li{margin:.3rem 0;line-height:1.5}
.toc-depth-3{padding-left:1rem}
.toc a{color:#475569;text-decoration:none;font-size:.875rem;padding:.15rem 0;border-left:2px solid transparent;padding-left:.5rem;display:block}
.toc a:hover{color:#4f46e5;border-left-color:#4f46e5}
.related-posts{background:#f8fafc;border:1px solid #e2e8f0;border-radius:.75rem;padding:1.25rem}
.sidebar-section-title{font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:0 0 .75rem}
.related-list{display:flex;flex-direction:column;gap:.75rem}
.related-card{display:flex;flex-direction:column;gap:.3rem;border:1px solid #e2e8f0;border-radius:.5rem;padding:.85rem 1rem;text-decoration:none;background:#fff;transition:border-color .15s ease,transform .15s ease,box-shadow .15s ease}
.related-card:hover{border-color:#818cf8;transform:translateX(3px);box-shadow:0 2px 8px rgba(99,102,241,.1)}
.related-title{font-weight:700;font-size:.875rem;color:#0f172a;line-height:1.4}
.related-desc{font-size:.775rem;color:#64748b;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.related-meta{font-size:.7rem;color:#94a3b8;margin-top:.2rem}
.newsletter-cta{background:linear-gradient(135deg,#1e293b,#0f172a);color:#f8fafc;padding:1.25rem;border-radius:.75rem;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -1px rgba(0,0,0,.06)}
.newsletter-cta h3{margin:0 0 .4rem;font-size:1.1rem;font-weight:700;color:#fff}
.newsletter-cta p{margin:0 0 1rem;color:#94a3b8;font-size:.85rem;line-height:1.5}
.newsletter-form{display:flex;gap:.5rem;flex-wrap:wrap}
.newsletter-form input[type=email]{flex:1;min-width:160px;padding:.6rem .85rem;border-radius:.375rem;border:1px solid #334155;background:#0f172a;color:#f8fafc;font-size:.875rem;outline:none}
.newsletter-form input[type=email]:focus{border-color:#3b82f6}
.newsletter-form button{padding:.6rem 1.25rem;border-radius:.375rem;border:none;background:#3b82f6;color:#fff;font-weight:600;cursor:pointer;font-size:.875rem}
.newsletter-form button:hover{background:#2563eb}
.review-banner{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;background:#fffbeb;border:1px solid #fcd34d;border-radius:.75rem;padding:.9rem 1.25rem;margin-bottom:2rem}
.review-done{background:#f0fdf4;border-color:#86efac}
.review-badge{font-weight:700;font-size:.85rem;color:#92400e;letter-spacing:.03em}
.review-done .review-badge{color:#166534}
.review-actions{display:flex;gap:.6rem}
.btn-approve{background:#059669;color:#fff;border:none;border-radius:.5rem;padding:.55rem 1.2rem;font-weight:600;cursor:pointer}
.btn-reject{background:#dc2626;color:#fff;border:none;border-radius:.5rem;padding:.55rem 1.2rem;font-weight:600;cursor:pointer}
.tag{background-color:#f1f5f9;color:#475569;font-size:.75rem;font-weight:600;padding:.2rem .6rem;border-radius:9999px;display:inline-block}
.tag-link{text-decoration:none}
.tag-link:hover{background-color:#e0e7ff;color:#4f46e5}
.affiliate-disclosure{background:#fffbeb;border-left:4px solid #f59e0b;padding:1rem 1.25rem;margin:2rem 0;font-size:.95rem;color:#92400e;border-radius:0 .5rem .5rem 0}
.disclosure-badge{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#2563eb;margin-bottom:.25rem}
@media(min-width:768px){
  .post-layout.has-toc{grid-template-columns:var(--sidebar-l) 1fr;grid-template-areas:'toc content';}
  .sidebar-left{grid-area:toc}
  .blog-post{grid-area:content}
  .sidebar-right{grid-area:right;display:none}
  .post-layout:not(.has-toc){grid-template-columns:1fr}
}
@media(min-width:1100px){
  .post-layout.has-toc{grid-template-columns:var(--sidebar-l) 1fr var(--sidebar-r);grid-template-areas:'toc content right';}
  .sidebar-left{grid-area:toc}
  .blog-post{grid-area:content}
  .sidebar-right{grid-area:right;display:block !important}
}
@media(max-width:767px){
  .post-layout{grid-template-columns:1fr}
  .sidebar-left,.sidebar-right{display:none}
  .post-title{font-size:1.75rem}
  .post-content{font-size:1rem}
}
</style>
</head>
<body>
<header class="site-header"><div class="header-inner">
<a class="site-title" href="/">Automated Blogger</a>
<nav class="site-nav"><a href="/">Home</a><a href="/tags">Tags</a></nav>
</div></header>
<main class="main-wrapper">
${reviewBanner}
<div class="post-layout ${tocHtml ? 'has-toc' : ''}">
${tocHtml ? `<aside class="sidebar sidebar-left"><div class="sidebar-sticky">${tocHtml}</div></aside>` : ''}
<article class="blog-post">
<header class="post-header">
<div class="post-meta"><time>${esc(pubDateStr)}</time><span class="meta-sep">&bull;</span><span>By ${esc(author)}</span>${readingTime ? `<span class="meta-sep">&bull;</span><span>${readingTime} min read</span>` : ''}</div>
<h1 class="post-title">${esc(title)}</h1>
${tagsHtml}
</header>
${disclosure}
<div class="post-content">${htmlBody}</div>
${sourcesHtml}
</article>
<aside class="sidebar sidebar-right"><div class="sidebar-sticky">
${relatedHtml}
<section class="newsletter-cta"><h3>Stay in the loop</h3><p>Get new posts delivered to your inbox.</p><form class="newsletter-form" onsubmit="return false"><input type="email" placeholder="you@example.com" aria-label="Email" /><button type="submit">Subscribe</button></form></section>
</div></aside>
</div>
</main>
<footer class="site-footer"><div class="footer-inner"><p>&copy; ${new Date().getFullYear()} Automated Blogger. Preview rendering — matches the Astro blog post layout.</p></div></footer>
</body>
</html>`);
  } catch (err) {
    res.status(500).send('Preview failed: ' + err.message);
  }
});

module.exports = router;