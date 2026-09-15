---
name: blog-write
description: Blog writing skill defining voice, tone, structure, and formatting standards. Use when drafting blog posts, structuring content sections, formatting markdown, or ensuring consistent writing style across posts.
---

# Blog Write Skill

Comprehensive writing guidelines for creating consistent, engaging blog content.

## Tool Routing: Connected-MCP-First (Mandatory)

- **Step 1 (REQUIRED) — generate the full post body ONLY via connected omniroute-mcp `omniroute_route_request`** (automatic best-model routing; hint `auto/best-free`). Feed it the Analyst's outline + verified facts/quotes and request the complete 800-1500 word MDX body. NEVER use direct OmniRoute API keys, base URLs, or pinned model names.
- **Step 2 (REQUIRED) — persist via automated-blogger `draft_post` with the `content` field.** `draft_post` is deterministic infrastructure only (persists MDX, does not generate prose). Calls without `content` are invalid.
- **If affiliate/sponsored content is present,** call `add_disclosure` after `draft_post`.
- The voice/structure/formatting standards below define WHAT `omniroute_route_request` must produce and what `draft_post` must persist.

## Voice and Tone Matrix

| Dimension | Approach |
|-----------|----------|
| **Technical Level** | Precise but accessible - explain jargon on first use |
| **Formality** | Conversational professional - "we" and "you" |
| **Sentence Style** | Active voice, varied length, transition sentences |
| **Paragraph Length** | 3-5 sentences, white space for scannability |
| **Audience** | Intermediate developers - some experience assumed |

## Target Audience Profile

**Primary:** Software developers with 2-5 years experience  
**Secondary:** Tech leads, engineering managers  
**Tertiary:** Computer science students, career switchers

Assume knowledge of:
- Basic programming concepts (variables, functions, loops)
- Common tools (git, npm, IDEs)
- Software development lifecycle
- Common design patterns

Do NOT assume:
- Familiarity with every framework/library
- Expertise in all languages
- Knowledge of your company's internal tools
- Understanding of obscure acronyms

## Content Structure

### Frontmatter (Required)

```yaml
---
title: "Clear, Benefit-Driven Title (50-60 chars)"
date: "2026-09-14"
excerpt: "Compelling 150-160 char summary with keywords for SEO and social sharing"
tags: ["javascript", "performance", "web-dev"]
author: "Automated Blogger"
featured_image: "/images/2026-09-14-post-slug.jpg"
featured_image_alt: "Descriptive alt text for accessibility"
draft: false
seo_title: "SEO-optimized title with primary keyword (60 chars)"
seo_description: "Meta description with secondary keywords (155 chars)"
canonical_url: ""
reading_time: "8 min"
---
```

Field requirements:
- **title:** 50-60 characters, front-load keywords, active voice
- **excerpt:** 150-160 characters, include primary keyword, CTA-like
- **tags:** 3-5 tags, lowercase, hyphen-separated
- **featured_image_alt:** Describe what's in the image, not "image of..."
- **reading_time:** Calculated at ~200 words/minute

### Body Structure

#### 1. Introduction (100-150 words)

**Hook (20-30 words):**
- Surprising statistic
- Common pain point
- Trending news
- Provocative question

**Context (40-60 words):**
- Why this matters now
- Current state of the problem
- Industry trend or shift

**Promise (40-60 words):**
- What readers will learn
- Specific outcomes
- Time investment

Example:
```markdown
TypeScript 5.7 just shipped with a feature that could eliminate an entire class of runtime errors. Over 23% of production bugs stem from incorrect type narrowing—a problem that's plagued TypeScript developers since the language's inception.

The new release introduces inferred type predicates, automatically deriving type guards from control flow analysis. This means the type system finally understands the same runtime checks your code already performs.

In this post, we'll explore how inferred type predicates work, when to use them over manual type guards, and how they integrate with existing TypeScript codebases. You'll walk away with practical patterns for safer type narrowing and a deeper understanding of TypeScript's type system evolution.
```

#### 2. Background Section (150-200 words)

**Purpose:** Fill knowledge gaps

Include:
- Key concepts defined
- Historical context (if relevant)
- Prerequisites readers need
- Links to foundational posts

Use definition lists for clarity:
```markdown
**Type Guard:** A runtime check that narrows a type within a conditional block.

**Type Predicate:** A return type annotation that tells TypeScript how a function affects type narrowing.

**Control Flow Analysis:** TypeScript's mechanism for tracking how conditions affect types.
```

#### 3. Main Content (400-800 words)

**Structure:** 3-5 key points, each with:
- H2 header (clear, descriptive)
- Conceptual explanation (50-100 words)
- Code example (10-30 lines)
- Analysis of example (30-50 words)

**Code Example Best Practices:**

```javascript
// ✅ GOOD: Annotated, focused, runnable
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Before: Manual type predicate
const items = ["hello", 42, "world"];
const strings = items.filter(isString); // string[]

// After: Inferred type predicate (TS 5.7)
const isStringInferred = (value: unknown) => {
  return typeof value === "string";
};
const stringsInferred = items.filter(isStringInferred); // string[]
```

```javascript
// ❌ BAD: No context, overly complex
function fn(a: any) {
  if (typeof a === "string") {
    return a.toUpperCase();
  }
  // ... 50 more lines ...
}
```

**Code Example Checklist:**
- [ ] Syntax highlighted (```language)
- [ ] Comments explain non-obvious parts
- [ ] Complete enough to run
- [ ] Max 30 lines (split longer examples)
- [ ] Diff format for before/after comparisons
- [ ] TypeScript examples include types

#### 4. Practical Applications (100-200 words)

**Answer:**
- When to use this technique
- When NOT to use it
- Common pitfalls
- Performance implications
- Compatibility concerns

**Format as decision tree:**
```markdown
**Use inferred type predicates when:**
- You have simple runtime checks (typeof, instanceof)
- The function signature is straightforward
- You want less boilerplate

**Use explicit type predicates when:**
- Complex multi-condition logic
- Need explicit type guard documentation
- Working with discriminated unions
```

#### 5. Comparison Section (Optional, 100-150 words)

If comparing approaches:
- Side-by-side code examples
- Pros/cons table
- Benchmark results (if performance-relevant)

```markdown
| Approach | Lines of Code | Type Safety | Runtime Cost |
|----------|---------------|-------------|--------------|
| Manual type guard | 5 | Excellent | Zero |
| Inferred predicate | 1 | Excellent | Zero |
| Type assertion | 1 | Poor | Zero |
```

#### 6. Conclusion (100-150 words)

**Summary (50-75 words):**
- Recap 3 key takeaways as bullet points
- Link back to the promise from intro

**Next Steps (50-75 words):**
- Actionable item reader can do now
- Link to related content
- Invitation to comment/discuss

Example:
```markdown
## Key Takeaways

Inferred type predicates in TypeScript 5.7:
- Automatically derive type guards from runtime checks
- Reduce boilerplate for simple typeof/instanceof patterns
- Integrate seamlessly with existing codebases (no breaking changes)

**Try it now:** Upgrade to TypeScript 5.7 and run your linter—many explicit type predicates can be removed. Check out the [official release notes](url) for more examples, or explore [advanced type narrowing patterns](url) in our next post.

*What's your experience with type guards? Share your use cases in the comments.*
```

#### 7. References Section (Required)

List all sources cited:
```markdown
## References

1. [TypeScript 5.7 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/) - TypeScript Team, September 2026
2. [Type Guards and Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - TypeScript Handbook
3. [Production Bug Analysis](https://example.com/research) - Engineering Research, August 2026
```

## Writing Style Guidelines

### Sentence Structure

**Vary length for rhythm:**
```markdown
✅ GOOD:
TypeScript 5.7 changes this. The compiler now infers type predicates automatically. You write less code. TypeScript understands more about your program's control flow.

❌ BAD (monotonous):
TypeScript 5.7 introduces inferred type predicates. This feature allows automatic derivation of type guards. It reduces boilerplate code. It improves type safety.
```

**Active voice preferred:**
```markdown
✅ GOOD: "TypeScript infers the predicate"
❌ BAD: "The predicate is inferred by TypeScript"
```

**Strong verbs:**
```markdown
✅ GOOD: "TypeScript eliminates this boilerplate"
❌ BAD: "This boilerplate is able to be eliminated by TypeScript"
```

### Paragraph Transitions

Use transition phrases:
- "Building on this..."
- "In contrast..."
- "This leads to..."
- "The result?"
- "Here's why..."

Example:
```markdown
The explicit approach requires five lines of boilerplate. **In contrast**, the inferred version condenses this to a single line. **The result?** Your codebase shrinks while type safety improves.
```

### Technical Accuracy

**Be precise:**
```markdown
✅ GOOD: "Reduces bundle size by ~15KB minified and gzipped"
❌ BAD: "Makes your bundle way smaller"

✅ GOOD: "Available in TypeScript 5.7+ (released September 2026)"
❌ BAD: "Works in modern TypeScript"
```

**Cite benchmarks:**
```markdown
✅ GOOD: "In our benchmark of 10,000 type checks, inferred predicates performed identically to explicit ones (±2% margin)"
❌ BAD: "Performance is basically the same"
```

### Accessibility

- **Alt text** for all images: Describe what's shown, not "image of..."
- **Code examples** with explanation: Don't assume readers can run screen readers over code
- **Link text** is descriptive: Not "click here" but "TypeScript 5.7 release notes"

## Formatting Standards

### Headers

```markdown
# Title (H1) - Only in frontmatter, never in body
## Main Section (H2) - Major divisions
### Subsection (H3) - Supporting points
#### Rarely Needed (H4) - Avoid if possible
```

### Emphasis

```markdown
**Bold** - Key terms, first use of important concepts
*Italic* - Emphasis, foreign words
`Code` - Inline code, function names, file paths
```

### Lists

**Bullets** for unordered features:
```markdown
- Benefit one
- Benefit two
- Benefit three
```

**Numbers** for steps or ranked items:
```markdown
1. First step
2. Second step
3. Third step
```

**Definition lists** for term/definition pairs:
```markdown
**Term:** Definition of the term.

**Another term:** Another definition.
```

### Code Blocks

Always specify language:
```markdown
\`\`\`typescript
// TypeScript example
const value: string = "hello";
\`\`\`

\`\`\`bash
# Shell commands
npm install typescript@latest
\`\`\`

\`\`\`json
{
  "config": "value"
}
\`\`\`
```

### Links

**Inline links** for primary content:
```markdown
According to [GitHub's Octoverse report](https://github.com/reports), TypeScript adoption grew 34%.
```

**Reference-style links** for repeated URLs:
```markdown
Check the [docs][ts-docs] for more details. The [TypeScript team][ts-docs] maintains excellent documentation.

[ts-docs]: https://www.typescriptlang.org/docs/
```

### Images

```markdown
![Descriptive alt text](/images/diagram.png)
*Caption: Performance comparison across 10,000 iterations*
```

### Callouts

Use blockquotes for emphasis:
```markdown
> **Note:** This feature requires TypeScript 5.7 or later.

> **Warning:** This pattern has performance implications at scale.

> **Tip:** Use the `--strict` flag to catch these errors at compile time.
```

## Quality Checks

Before submitting:

### Readability
- [ ] Flesch-Kincaid grade: 8-10
- [ ] Average sentence length: 15-20 words
- [ ] Average paragraph length: 3-5 sentences
- [ ] Transition phrases between sections

### Technical Accuracy
- [ ] All code examples are syntactically valid
- [ ] Version numbers specified where relevant
- [ ] Statistics cited with sources
- [ ] Links functional and pointing to correct pages

### Structure
- [ ] Frontmatter complete and valid YAML
- [ ] Introduction hooks within 2 sentences
- [ ] Each section has clear purpose
- [ ] Conclusion includes actionable takeaway
- [ ] References section populated

### SEO
- [ ] Primary keyword in title
- [ ] Primary keyword in first paragraph
- [ ] Secondary keywords in headers
- [ ] Meta description 155 characters
- [ ] Image alt text includes keywords (naturally)

### Accessibility
- [ ] All images have descriptive alt text
- [ ] Links have descriptive anchor text
- [ ] Code examples have textual explanation
- [ ] Color not sole means of conveying info

## Common Mistakes to Avoid

### ❌ Don't

- Start with "In this post, I will..."
- Use filler phrases: "It's worth noting that..."
- Write wall-of-text paragraphs (>7 sentences)
- Use vague quantifiers: "much faster", "way better"
- Leave unexplained jargon
- Write in passive voice by default
- Use future tense for instructions: "We will see..."
- Include code without explanation

### ✅ Do

- Hook immediately with problem or surprise
- Use precise language: "15% faster", "3× throughput"
- Break content into scannable chunks
- Explain jargon on first use
- Write in active voice
- Use present tense for instructions: "We see..."
- Annotate code with comments
- Include transition sentences

## Tone Examples

### Too Casual (Avoid)
```markdown
OMG, TypeScript just dropped this sick new feature! 🔥 It's gonna change everything. You're not gonna believe how much easier this makes your code. Trust me, you need to check this out ASAP!
```

### Too Formal (Avoid)
```markdown
The TypeScript programming language has recently introduced a novel feature pertaining to the automatic inference of type predicates. This enhancement facilitates the reduction of boilerplate code whilst simultaneously maintaining robust type safety guarantees.
```

### Just Right (Aim for This)
```markdown
TypeScript 5.7 introduces inferred type predicates, a feature that eliminates boilerplate while preserving type safety. Instead of manually writing type guards, the compiler now derives them from your runtime checks. Let's explore how this works in practice.
```

## Template

Use this as starting point:

```markdown
---
title: "[Benefit]: [Specific Topic] in [Context]"
date: "YYYY-MM-DD"
excerpt: "[Hook] [Benefit] in [Constraint/Time]"
tags: ["primary", "secondary", "tertiary"]
author: "Automated Blogger"
featured_image: "/images/YYYY-MM-DD-slug.jpg"
featured_image_alt: "Descriptive alt text"
draft: false
---

[Opening hook: problem, stat, or surprise]

[Context: why this matters now]

[Promise: what readers will learn]

## Background: [What You Need to Know]

[Fill knowledge gaps]

## [Key Point 1]

[Explanation]

\`\`\`language
// Code example
\`\`\`

[Analysis of example]

## [Key Point 2]

[Repeat structure]

## When to Use This

[Decision criteria]

## Key Takeaways

- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

[Next steps with action]

## References

1. [Source 1](url) - Author, Date
2. [Source 2](url) - Author, Date
```
