import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Paranthaman'),
    tags: z.array(z.string()),
    affiliateLinks: z
      .array(
        z.object({
          url: z.string(),
          product: z.string(),
        })
      )
      .optional(),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
        })
      )
      .optional(),
  }),
});

export const collections = { blog };
