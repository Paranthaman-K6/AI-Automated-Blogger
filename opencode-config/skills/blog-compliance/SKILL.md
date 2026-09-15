---
name: blog-compliance
description: Legal and ethical compliance skill for blog posts covering FTC disclosure requirements, copyright fair use rules, plagiarism detection, and risk assessment. Use when checking posts for legal compliance, verifying FTC disclosures, assessing copyright usage, or detecting plagiarism.
---

# Blog Compliance Skill

Legal and ethical compliance guidelines for blog content.

## Tool Routing: Connected-MCP-First (Mandatory)

- **automated-blogger tools are deterministic infrastructure only:** `add_disclosure` (attach FTC disclosure), `check_ftc` (validate disclosure), `check_copyright` (validate originality/quotations). These tools check — they do not generate prose.
- **Model routing:** `auto/best-free` via connected omniroute-mcp `omniroute_route_request` for any analysis/summarization. NEVER use direct OmniRoute API keys, base URLs, or pinned model names.
- The FTC/copyright/plagiarism standards below define WHAT the deterministic checks must enforce.

## FTC Disclosure Requirements

### Legal Basis

**16 CFR Part 255** (FTC Endorsement Guides)  
Updated: 2023 (Digital Advertising)

Core principle: **Material connections must be clearly and conspicuously disclosed.**

### When Disclosure Required

Disclosure needed if ANY of these apply:

| Connection Type | Examples | Disclosure Required |
|----------------|----------|---------------------|
| **Financial** | Affiliate links, commissions, paid placement | ✅ Yes |
| **Free products** | Review units, free software licenses | ✅ Yes |
| **Employment** | Writing about employer's product | ✅ Yes |
| **Ownership** | Stock ownership, board member | ✅ Yes |
| **Family/Personal** | Spouse works at company | ✅ Yes |
| **Sponsored** | Paid by company for post | ✅ Yes |
| **No connection** | Genuine recommendation, no compensation | ❌ No |

### Disclosure Placement

**FTC Requirements:**
- **Above the fold** - Visible without scrolling
- **Before material** - Before product discussion
- **Clear and conspicuous** - Not buried in footer
- **Plain language** - No legalese or vague terms

**Acceptable placements:**
1. Immediately after introduction (BEST)
2. Before first product mention
3. Highlighted box at top of post

**Unacceptable placements:**
- Footer of page
- Behind "Read More" link
- Tiny font at bottom
- Hyperlinked disclosure text

### Disclosure Wording

**Required elements:**
- Nature of relationship
- What you received
- Clear statement it's compensation

#### Standard Templates

**Affiliate links:**
```markdown
> **Disclosure:** This post contains affiliate links. We earn a commission if you purchase through these links at no additional cost to you. Our recommendations are based on genuine experience, not compensation.
```

**Sponsored content:**
```markdown
> **Sponsored Post:** [Company Name] paid us to write this post. All opinions are our own and reflect our honest evaluation of the product. We only accept sponsorships for products we've personally tested.
```

**Free review product:**
```markdown
> **Disclosure:** [Company Name] provided [Product Name] free of charge for review purposes. This does not affect our editorial independence. We evaluate all products by the same standards regardless of how we obtained them.
```

**Employment relationship:**
```markdown
> **Disclosure:** The author is employed by [Company Name], which produces the software discussed in this post. This review reflects personal experience and independent analysis, not company policy.
```

**Multiple connections:**
```markdown
> **Disclosure:** This post contains affiliate links AND we received [Product Name] free of charge for review. We earn commissions on purchases and received the review unit from [Company Name]. Our evaluation remains independent.
```

### Social Media Considerations

If post is shared on social media, disclosure must travel with it:

**Twitter/X:**
```
#ad Check out [product] - [brief take]
```

**LinkedIn:**
```
[Post text]

Disclosure: This is sponsored content from [Company].
```

**Facebook/Reddit:**
Disclosure in FIRST paragraph of post, not buried in comments.

### FTC Compliance Checklist

- [ ] Disclosure present if material connection exists
- [ ] Disclosure placed prominently (before main content)
- [ ] Disclosure uses clear, unambiguous language
- [ ] Disclosure specifies nature of relationship (affiliate/sponsored/free)
- [ ] Disclosure visible on mobile devices
- [ ] Disclosure not hidden behind interactions
- [ ] Social shares include #ad or #sponsored hashtag
- [ ] No misleading claims about product
- [ ] Review based on genuine experience (not just press materials)

### Edge Cases

**Q: Do I need disclosure for Amazon links?**  
A: Yes, if you're part of Amazon Associates program.

**Q: What about products I bought myself?**  
A: No disclosure needed if you have no material connection.

**Q: If I trash a product I received for free?**  
A: Still need disclosure. Negative reviews require disclosure too.

**Q: Button linking to affiliate offer?**  
A: Yes, label button: "Buy Now (affiliate link)"

**Q: Comparing products where some are affiliate links?**  
A: Disclose at top: "Some links in this comparison are affiliate links."

## Copyright Compliance

### Fair Use Doctrine (17 USC § 107)

Four factors considered:

1. **Purpose and character** - Transformative? Educational? Commercial?
2. **Nature of copyrighted work** - Factual vs. creative?
3. **Amount used** - How much of the original?
4. **Effect on market** - Does it replace the original?

**No bright-line rules**, but these guidelines reduce risk:

### Quote Limits

| Content Type | Max Allowed | Attribution Required |
|--------------|-------------|---------------------|
| **Text (single article)** | 300 words | Yes |
| **Text (book)** | 500 words | Yes |
| **Code snippet** | 50 lines | Yes |
| **Poem** | 3-4 lines | Yes |
| **Lyrics** | 1-2 lines | Yes |
| **News article** | 200 words | Yes |

**Percentage rule:** <10% of original work

### Attribution Requirements

Every quote must include:
- Source title
- Author name
- Publication name/website
- Date published
- Link to original (if online)
- Copyright notice (if present in original)

**Format:**
```markdown
> "Exact quote here, unmodified, in quote block."
> 
> — **Author Name**, *Source Title* ([Publisher Name](url), Date)
```

**Code attribution:**
```javascript
// Adapted from: https://github.com/user/repo/blob/main/file.ts
// Original author: Name
// License: MIT
function example() {
  // ...
}
```

### Image Usage

| Source | Usage Allowed | Attribution | License Check |
|--------|---------------|-------------|---------------|
| **Your own** | ✅ Yes | Optional | N/A |
| **Unsplash** | ✅ Yes | Recommended | Check terms |
| **Pexels** | ✅ Yes | Recommended | Check terms |
| **Pixabay** | ✅ Yes | Recommended | Check terms |
| **Flickr CC** | ✅ If CC license | Required | Check CC type |
| **Google Images** | ❌ No (mostly) | N/A | Assume copyrighted |
| **Stock photos (paid)** | ✅ If licensed | Per license | Check usage rights |
| **Screenshots** | ✅ Usually (fair use) | Source mentioned | Document use |
| **Third-party (no permission)** | ❌ No | N/A | Get permission |

**Image attribution format:**
```markdown
![Alt text describing image](/images/example.jpg)
*Image credit: [Photographer Name](profile-url) via [Unsplash](image-url) - [Unsplash License](license-url)*
```

**Screenshots fair use:**
- ✅ Criticism, commentary, education
- ✅ Minimal portion showing specific feature
- ✅ Transformative (annotated, cropped to show point)
- ❌ High-resolution, unmodified full screenshots
- ❌ Used as decoration, not for analysis

### Code Licensing

Check license before using code:

| License | Commercial OK | Attribution Required | Share-Alike Required |
|---------|---------------|---------------------|---------------------|
| **MIT** | ✅ Yes | ✅ Yes | ❌ No |
| **Apache 2.0** | ✅ Yes | ✅ Yes | ❌ No |
| **BSD** | ✅ Yes | ✅ Yes | ❌ No |
| **GPL** | ✅ Yes* | ✅ Yes | ✅ Yes* |
| **LGPL** | ✅ Yes | ✅ Yes | ⚠️ Sometimes |
| **CC BY** | ✅ Yes | ✅ Yes | ❌ No |
| **CC BY-SA** | ✅ Yes | ✅ Yes | ✅ Yes |
| **CC BY-NC** | ❌ No | ✅ Yes | ❌ No |
| **All Rights Reserved** | ❌ No | ✅ Yes | N/A |

*GPL requires derivative works also be GPL-licensed.

**When copying code:**
1. Check LICENSE file in repo
2. Check file header comments
3. Preserve copyright notices
4. Link to original source
5. Note any modifications made

### Copyright Checklist

- [ ] All quotes <300 words per source
- [ ] All quotes attributed with source, author, date, link
- [ ] Total quoted content <10% of post
- [ ] Images have proper licenses (CC, stock, own)
- [ ] Image attribution includes photographer, platform, license
- [ ] Code snippets include license notice
- [ ] No copying entire articles or chapters
- [ ] No circumventing paywalls
- [ ] No removing watermarks or attribution
- [ ] Screenshots used for fair use purposes (commentary/criticism)

## Plagiarism Detection

### Automated Checks

Run these checks before publication:

#### 1. Sentence-Level Similarity

Flag passages with ≥5 consecutive identical words:

```javascript
function detectSimilarity(yourText, sourceText) {
  const yourWords = yourText.toLowerCase().split(/\s+/);
  const sourceWords = sourceText.toLowerCase().split(/\s+/);
  
  let maxMatch = 0;
  let currentMatch = 0;
  
  for (let i = 0; i < yourWords.length; i++) {
    const window = yourWords.slice(i, i + 10);
    const found = sourceWords.join(' ').includes(window.join(' '));
    
    if (found) {
      currentMatch = window.length;
      maxMatch = Math.max(maxMatch, currentMatch);
    } else {
      currentMatch = 0;
    }
  }
  
  return maxMatch; // If ≥5, flag for review
}
```

#### 2. Paragraph Fingerprinting

Hash paragraphs and compare:

```javascript
function createFingerprint(text) {
  return crypto
    .createHash('md5')
    .update(text.toLowerCase().replace(/\s+/g, ''))
    .digest('hex');
}

function compareFingerprints(yourParagraphs, sourceParagraphs) {
  const yourPrints = yourParagraphs.map(createFingerprint);
  const sourcePrints = sourceParagraphs.map(createFingerprint);
  
  const matches = yourPrints.filter(fp => sourcePrints.includes(fp));
  return matches.length; // If >0, investigate
}
```

#### 3. Originality Score

Calculate percentage of original content:

```
Originality = (Original Words / Total Words) × 100
```

**What counts as original:**
- Your analysis and commentary
- Your code examples (not copied)
- Your experiences and observations
- Synthesis of multiple sources
- Paraphrasing in your own words (>50% different)

**What doesn't count as original:**
- Direct quotes (even with attribution)
- Code copied from documentation
- Definitions from sources
- Statistics from studies
- Standard boilerplate

**Thresholds:**
- ≥70% = PASS (publication approved)
- 50-69% = NEEDS REVISION (too derivative)
- <50% = FAILED (likely plagiarism)

### Manual Plagiarism Review

Check for these patterns:

**Patchwriting (unacceptable):**
```markdown
❌ Source: "TypeScript's type system is based on structural subtyping"
❌ Your text: "TypeScript's type system relies on structural subtyping"
// Too similar, just word swap
```

```markdown
✅ Source: "TypeScript's type system is based on structural subtyping"
✅ Your text: "Unlike nominal typing systems, TypeScript determines type compatibility by examining the shape of objects rather than their declared names"
// Fully rewritten, adds context
```

**Unattributed paraphrasing (unacceptable):**
```markdown
❌ Source: "Inferred type predicates automatically derive type guards"
❌ Your text: "Type guards are automatically derived by inferred type predicates"
// Just rearranged, no attribution
```

```markdown
✅ Source: "Inferred type predicates automatically derive type guards"
✅ Your text: "As the TypeScript team explains, inferred type predicates [automate type guard creation](source-url), eliminating manual boilerplate"
// Paraphrased with attribution
```

**Mosaic plagiarism (unacceptable):**
Taking phrases from multiple sources and stitching together without attribution.

### Plagiarism Checklist

- [ ] No passages with ≥5 consecutive identical words (unless quoted)
- [ ] No identical paragraph fingerprints
- [ ] Originality score ≥70%
- [ ] All paraphrased ideas attributed
- [ ] All statistics cited with source
- [ ] All code snippets attributed or original
- [ ] Writing style consistent throughout
- [ ] No patchwriting (minor word substitutions)
- [ ] No mosaic plagiarism (stitching phrases from sources)

## Legal Risk Assessment

### Risk Categories

#### High Risk (Do Not Publish)

🚫 **Defamation:**
- Unverified claims of illegal activity
- Personal attacks on individuals
- False statements damaging reputation
- Allegations without proof

🚫 **Legal advice:**
- Specific legal recommendations
- Contract interpretation
- Regulatory guidance
- Tax advice

🚫 **Medical advice:**
- Diagnosis or treatment recommendations
- Drug or supplement advice
- Mental health guidance
- Safety claims

🚫 **Financial advice:**
- Investment recommendations
- Stock tips
- Financial planning advice
- Securities analysis

🚫 **Privacy violations:**
- Publishing private information
- Doxxing individuals
- Sharing leaked data
- Violating NDAs

🚫 **Copyright infringement:**
- Copying substantial portions
- Circumventing DRM
- Sharing pirated content
- Removing attribution

🚫 **Criminal instructions:**
- How to commit crimes
- Circumventing security (maliciously)
- Creating weapons
- Fraud techniques

#### Medium Risk (Review Carefully)

⚠️ **Product criticism:**
- Negative reviews (ensure factual)
- Performance critiques (benchmarks required)
- Security concerns (responsible disclosure)
- Comparisons (fair and accurate)

⚠️ **Reverse engineering:**
- Protocol analysis (check EULA)
- File format documentation
- API reimplementation
- Binary analysis

⚠️ **Security research:**
- Vulnerability disclosure (coordinated)
- Exploit proof-of-concepts (educational)
- Penetration testing techniques
- Malware analysis

⚠️ **DMCA risks:**
- Content about DRM circumvention
- Discussion of copyright tools
- Streaming/downloading topics
- Emulation and ROMs

**Medium risk mitigation:**
- Get legal review for controversial claims
- Use factual language, avoid hyperbole
- Cite all claims with sources
- Include disclaimers where appropriate
- Follow responsible disclosure timelines
- Provide educational context for sensitive topics

#### Low Risk (Proceed)

✅ **Technical tutorials:**
- Programming how-tos
- Tool usage guides
- Configuration instructions
- Best practices

✅ **Opinion pieces:**
- With clear attribution
- Distinguishing fact from opinion
- Avoiding defamatory statements
- On public figures/companies

✅ **Product reviews:**
- Of publicly released products
- Based on personal experience
- With FTC disclosure if applicable
- Fair and factual

✅ **Data analysis:**
- Of public datasets
- With source attribution
- Accurate representation
- Proper methodology

✅ **Educational content:**
- Teaching programming concepts
- Explaining technologies
- Documenting history
- Analyzing trends

### Risk Mitigation Strategies

For medium-risk content:

**1. Disclaimer text:**
```markdown
> **Disclaimer:** This post contains the author's opinions and should not be construed as [legal/medical/financial] advice. Consult a qualified professional for guidance specific to your situation.
```

**2. Factual language:**
```markdown
❌ "This product is garbage and will destroy your computer"
✅ "In our testing, this product caused system instability in 3 of 5 trial runs"
```

**3. Source everything:**
```markdown
❌ "Most developers prefer TypeScript"
✅ "According to GitHub's Octoverse 2025, TypeScript is the 4th most popular language with 34% YoY growth"
```

**4. Responsible disclosure:**
- Report security issues privately first
- Give vendor 90 days to patch
- Coordinate public disclosure
- Don't publish exploits until patched

**5. Legal review threshold:**
Request legal review if post:
- Criticizes large companies with aggressive legal teams
- Discusses ongoing litigation
- Analyzes controversial regulation
- Could be interpreted as defamatory
- Reveals confidential information
- Discusses patent or trademark issues

## Compliance Report Format

Return structured compliance assessment:

```json
{
  "draft_file": "/path/to/draft.md",
  "compliance_date": "2026-09-14T17:02:38Z",
  
  "ftc_check": {
    "material_connection": true,
    "disclosure_required": true,
    "disclosure_present": true,
    "disclosure_placement": "after_introduction",
    "disclosure_adequate": true,
    "issues": []
  },
  
  "copyright_check": {
    "max_quote_length": 287,
    "total_quoted_words": 450,
    "quotes_attributed": 8,
    "quotes_unattributed": 0,
    "quote_percentage": 8.5,
    "images": [
      {
        "file": "diagram.png",
        "source": "original",
        "license": "N/A",
        "attributed": true
      }
    ],
    "code_snippets": [
      {
        "lines": 25,
        "source": "https://github.com/example/repo",
        "license": "MIT",
        "attributed": true
      }
    ],
    "fair_use_compliant": true,
    "issues": []
  },
  
  "plagiarism_check": {
    "originality_score": 78.5,
    "flagged_passages": [],
    "max_similarity": 4,
    "sources_properly_cited": true,
    "status": "pass"
  },
  
  "legal_risk": {
    "level": "low",
    "categories": {
      "defamation": false,
      "legal_advice": false,
      "medical_advice": false,
      "financial_advice": false,
      "privacy_violation": false,
      "copyright_infringement": false,
      "criminal_content": false
    },
    "concerns": [],
    "recommendations": [],
    "legal_review_needed": false
  },
  
  "overall_status": "approved",
  "required_changes": [],
  "approval_timestamp": "2026-09-14T17:10:45Z"
}
```

## Final Approval Criteria

Approve for publication ONLY if:
- ✅ FTC compliance: PASS (disclosure present if needed)
- ✅ Copyright compliance: PASS (quotes <300w, attributed, <10% total)
- ✅ Originality score: ≥70%
- ✅ Legal risk: Low (or Medium with mitigations)
- ✅ All sources cited and linked
- ✅ All images properly licensed and attributed
- ✅ No defamatory content
- ✅ No high-risk categories present

If ANY check fails, return `status: "needs_revision"` with specific required changes.

Never approve content that:
- Contains defamatory statements
- Provides unlicensed legal/medical/financial advice
- Violates copyright (substantial copying)
- Includes plagiarism (originality <70%)
- Violates privacy
- Has high legal risk without review
