import { CommitDraftInput, DeployVercelInput } from '../types/schemas.js';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DRAFTS_PATH = process.env.DRAFTS_PATH || '/home/paranthaman/Projects/automated-blogger/drafts';
const BLOG_PATH = process.env.BLOG_PATH || '/home/paranthaman/Projects/automated-blogger/blog';
const QUOTA_FILE = '/tmp/vercel-quota.json';

interface QuotaData {
  used: number;
  limit: number;
  lastReset: string;
}

async function loadQuota(): Promise<QuotaData> {
  try {
    const content = await fs.readFile(QUOTA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { used: 0, limit: 100, lastReset: new Date().toISOString() };
  }
}

async function saveQuota(quota: QuotaData): Promise<void> {
  await fs.writeFile(QUOTA_FILE, JSON.stringify(quota, null, 2), 'utf-8');
}

export const commitDraft = {
  schema: CommitDraftInput,
  handler: async ({ draftIds, batchId }: { draftIds: string[]; batchId: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const branch = `blog-batch-${today}`;
    
    const originalBranch = execSync('git rev-parse --abbrev-ref HEAD', { 
      cwd: BLOG_PATH, 
      encoding: 'utf-8' 
    }).trim();

    try {
      execSync(`git checkout -b ${branch}`, { cwd: BLOG_PATH });
    } catch {
      execSync(`git checkout ${branch}`, { cwd: BLOG_PATH });
    }

    let filesCommitted = 0;
    const contentDir = path.join(BLOG_PATH, 'src/content/blog');
    await fs.mkdir(contentDir, { recursive: true });

    for (const draftId of draftIds) {
      try {
        const sourcePath = path.join(DRAFTS_PATH, 'approved', `${draftId}.mdx`);
        const destPath = path.join(contentDir, `${draftId}.mdx`);
        
        await fs.copyFile(sourcePath, destPath);
        execSync(`git add "${destPath}"`, { cwd: BLOG_PATH });
        filesCommitted++;
      } catch (error) {
        console.error(`Failed to commit draft ${draftId}:`, error);
      }
    }

    if (filesCommitted > 0) {
      execSync(`git commit -m "Add batch ${batchId}: ${filesCommitted} posts"`, { cwd: BLOG_PATH });
    }

    return {
      branch,
      filesCommitted
    };
  }
};

export const deployVercel = {
  schema: DeployVercelInput,
  handler: async ({ batchId, localPreviewFirst, skipPreview }: { 
    batchId: string; 
    localPreviewFirst?: boolean; 
    skipPreview?: boolean 
  }) => {
    const quota = await loadQuota();
    
    if (quota.used >= quota.limit * 0.95) {
      throw new Error(`Vercel quota exhausted: ${quota.used}/${quota.limit} deployments used`);
    }

    const today = new Date().toISOString().split('T')[0];
    const branch = `blog-batch-${today}`;

    try {
      execSync(`git push -u origin ${branch}`, { cwd: BLOG_PATH });
    } catch (error) {
      console.error('Git push warning:', error);
    }

    if (localPreviewFirst && !skipPreview) {
      return {
        status: 'preview',
        quotaRemaining: quota.limit - quota.used,
        postsPublished: 0
      };
    }

    quota.used += 1;
    await saveQuota(quota);

    const postsPublished = parseInt(
      execSync(`git diff --name-only HEAD~1 HEAD | grep -c "src/content/blog" || echo 0`, { 
        cwd: BLOG_PATH, 
        encoding: 'utf-8' 
      }).trim()
    );

    return {
      status: 'deployed',
      quotaRemaining: quota.limit - quota.used,
      postsPublished
    };
  }
};
