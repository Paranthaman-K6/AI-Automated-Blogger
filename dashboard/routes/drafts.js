const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DRAFTS_PATH = process.env.DRAFTS_PATH || '/home/paranthaman/Projects/automated-blogger/drafts';

async function findDraftPath(id, status) {
  const dir = path.join(DRAFTS_PATH, status);
  for (const ext of ['.md', '.mdx']) {
    const candidate = path.join(dir, `${id}${ext}`);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next extension
    }
  }
  return null;
}

async function getDraftsByStatus(status) {
  const statusPath = path.join(DRAFTS_PATH, status);
  try {
    const files = await fs.readdir(statusPath);
    const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    
    const drafts = await Promise.all(mdFiles.map(async (file) => {
      const filePath = path.join(statusPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let metadata = {};
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        frontmatter.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length) {
            metadata[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
          }
        });
      }
      
      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
      const wordCount = bodyContent.split(/\s+/).filter(w => w.length > 0).length;
      
      return {
        id: file.replace(/\.mdx?$/, ''),
        filename: file,
        title: metadata.title || file,
        status,
        wordCount,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        metadata
      };
    }));
    
    return drafts;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

router.get('/', async (req, res) => {
  try {
    const [pending, approved, rejected, published] = await Promise.all([
      getDraftsByStatus('pending'),
      getDraftsByStatus('approved'),
      getDraftsByStatus('rejected'),
      getDraftsByStatus('published')
    ]);
    
    res.json({ pending, approved, rejected, published });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const statuses = ['pending', 'approved', 'rejected', 'published'];
    
    for (const status of statuses) {
      let filePath;
      for (const ext of ['.md', '.mdx']) {
        const candidate = path.join(DRAFTS_PATH, status, `${id}${ext}`);
        try {
          await fs.access(candidate);
          filePath = candidate;
          break;
        } catch {
          // try next extension
        }
      }
      if (!filePath) continue;
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let metadata = {};
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          frontmatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
              metadata[key.trim()] = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
            }
          });
        }
        
        const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');
        
        return res.json({ id, status, metadata, content: body, raw: content });
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }
    
    res.status(404).json({ error: 'Draft not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const sourcePath = await findDraftPath(id, 'pending');
    if (!sourcePath) return res.status(404).json({ error: 'Draft not found' });
    const ext = path.extname(sourcePath);
    const destPath = path.join(DRAFTS_PATH, 'approved', `${id}${ext}`);
    
    await fs.mkdir(path.join(DRAFTS_PATH, 'approved'), { recursive: true });
    await fs.rename(sourcePath, destPath);
    
    res.json({ success: true, message: 'Draft approved', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const sourcePath = await findDraftPath(id, 'pending');
    if (!sourcePath) return res.status(404).json({ error: 'Draft not found' });
    const ext = path.extname(sourcePath);
    const destPath = path.join(DRAFTS_PATH, 'rejected', `${id}${ext}`);
    
    let content = await fs.readFile(sourcePath, 'utf-8');
    
    if (reason) {
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const updatedFrontmatter = frontmatterMatch[1] + `\nrejectionReason: "${reason}"`;
        content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${updatedFrontmatter}\n---`);
      }
    }
    
    await fs.mkdir(path.join(DRAFTS_PATH, 'rejected'), { recursive: true });
    await fs.writeFile(destPath, content);
    await fs.unlink(sourcePath);
    
    res.json({ success: true, message: 'Draft rejected', id, reason });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
