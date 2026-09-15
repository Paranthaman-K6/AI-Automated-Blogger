import type { CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;

/**
 * Deterministic related-post scoring: shared tags (case-insensitive),
 * tie-broken by newer publish date. No randomness — stable across builds.
 */
export function getRelatedPosts(current: BlogPost, all: BlogPost[], count = 3): BlogPost[] {
  const tags = new Set((current.data.tags ?? []).map((t) => t.toLowerCase()));

  return all
    .filter((p) => p.id !== current.id)
    .map((p) => ({
      post: p,
      shared: (p.data.tags ?? []).filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        +new Date(b.post.data.pubDate) - +new Date(a.post.data.pubDate)
    )
    .slice(0, count)
    .map((x) => x.post);
}
