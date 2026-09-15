import type { CollectionEntry } from 'astro:content';

type BlogPost = CollectionEntry<'blog'>;

export function tagSlug(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, '-');
}

/** Unique tags across all posts with post counts, sorted by count desc. */
export function collectTags(posts: BlogPost[]): Array<{ tag: string; slug: string; count: number }> {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      const key = tag.toLowerCase();
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { tag, count: 1 });
    }
  }
  return [...counts.entries()]
    .map(([key, v]) => ({ tag: v.tag, slug: tagSlug(key), count: v.count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
