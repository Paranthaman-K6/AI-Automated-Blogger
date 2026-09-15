import { z } from 'zod';

export const CheckRobotsInput = z.object({
  url: z.string().url()
});

export const ScrapeSourceInput = z.object({
  url: z.string().url(),
  selector: z.string().optional(),
  timeout: z.number().optional().default(30000)
});

export const SearchSourcesInput = z.object({
  query: z.string(),
  sources: z.array(z.enum(['hn'])).optional().default(['hn'])
});

export const SummarizeArticleInput = z.object({
  content: z.string(),
  url: z.string().url(),
  summary: z.string().optional(),
  facts: z.array(z.string()).optional(),
  quotes: z.array(z.string()).optional()
});

export const DraftPostInput = z.object({
  title: z.string(),
  research: z.array(z.object({
    url: z.string(),
    summary: z.string(),
    facts: z.array(z.string()).optional(),
    quotes: z.array(z.string()).optional()
  })),
  voice: z.string().optional().default('professional'),
  content: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional()
});

export const AddDisclosureInput = z.object({
  draftId: z.string(),
  affiliateLinks: z.array(z.string()).optional().default([])
});

export const CheckFTCInput = z.object({
  draftId: z.string()
});

export const CheckCopyrightInput = z.object({
  draftId: z.string()
});

export const CommitDraftInput = z.object({
  draftIds: z.array(z.string()),
  batchId: z.string()
});

export const DeployVercelInput = z.object({
  batchId: z.string(),
  localPreviewFirst: z.boolean().optional().default(false),
  skipPreview: z.boolean().optional().default(false)
});
