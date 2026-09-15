import { CheckFTCInput, CheckCopyrightInput } from '../types/schemas.js';
import { getDraft } from '../services/memory.js';

export const checkFTC = {
  schema: CheckFTCInput,
  handler: async ({ draftId }: { draftId: string }) => {
    const draft = await getDraft(draftId);
    if (!draft) {
      return { pass: false, issues: ['Draft not found'] };
    }

    const issues: string[] = [];
    const hasAffiliateLinks = draft.metadata.affiliateLinks && 
                              Array.isArray(draft.metadata.affiliateLinks) && 
                              draft.metadata.affiliateLinks.length > 0;

    if (hasAffiliateLinks) {
      const contentLower = draft.content.toLowerCase();
      const hasDisclosure = contentLower.includes('affiliate') && 
                           (contentLower.includes('commission') || contentLower.includes('earn'));

      if (!hasDisclosure) {
        issues.push('Affiliate links present but no proper FTC disclosure found');
      }
    }

    return {
      pass: issues.length === 0,
      issues
    };
  }
};

export const checkCopyright = {
  schema: CheckCopyrightInput,
  handler: async ({ draftId }: { draftId: string }) => {
    const draft = await getDraft(draftId);
    if (!draft) {
      return { pass: false, issues: ['Draft not found'], originality: 0 };
    }

    const issues: string[] = [];
    
    const sentences = draft.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    const originality = sentences.length > 0 ? uniqueSentences.size / sentences.length : 0;

    const quoteBlockRegex = /^>.*$/gm;
    const quoteBlocks = draft.content.match(quoteBlockRegex);
    
    if (quoteBlocks) {
      for (const block of quoteBlocks) {
        const wordCount = block.split(/\s+/).length;
        if (wordCount > 300) {
          issues.push(`Quote block exceeds 300 words (${wordCount} words)`);
        }
      }
    }

    if (originality < 0.7) {
      issues.push(`Low originality score: ${(originality * 100).toFixed(1)}%`);
    }

    return {
      pass: issues.length === 0,
      issues,
      originality: Math.round(originality * 100) / 100
    };
  }
};
