import { promises as fs } from 'fs';
import path from 'path';

const DRAFTS_PATH = process.env.DRAFTS_PATH || '/home/paranthaman/Projects/automated-blogger/drafts';

export async function saveDraft(
  title: string,
  content: string,
  metadata: object
): Promise<string> {
  const draftId = `${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50)}`;
  const pendingDir = path.join(DRAFTS_PATH, 'pending');
  
  await fs.mkdir(pendingDir, { recursive: true });
  
  const filePath = path.join(pendingDir, `${draftId}.mdx`);
  const fullContent = `---
${Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}
---

${content}`;
  
  await fs.writeFile(filePath, fullContent, 'utf-8');
  
  return draftId;
}

export async function getDraft(
  draftId: string
): Promise<{ content: string; metadata: any } | null> {
  const locations = ['pending', 'approved', 'rejected'];
  
  for (const loc of locations) {
    try {
      const filePath = path.join(DRAFTS_PATH, loc, `${draftId}.mdx`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) {
        return { content: fileContent, metadata: {} };
      }
      
      const [, frontmatter, content] = match;
      const metadata: any = {};
      
      for (const line of frontmatter.split('\n')) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          try {
            metadata[key] = JSON.parse(value);
          } catch {
            metadata[key] = value;
          }
        }
      }
      
      return { content, metadata };
    } catch {
      continue;
    }
  }
  
  return null;
}

export async function moveDraft(
  draftId: string,
  from: 'pending' | 'approved',
  to: 'approved' | 'rejected'
): Promise<boolean> {
  try {
    const sourcePath = path.join(DRAFTS_PATH, from, `${draftId}.mdx`);
    const destDir = path.join(DRAFTS_PATH, to);
    const destPath = path.join(destDir, `${draftId}.mdx`);
    
    await fs.mkdir(destDir, { recursive: true });
    await fs.rename(sourcePath, destPath);
    
    return true;
  } catch {
    return false;
  }
}
