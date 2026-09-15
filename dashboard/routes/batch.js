const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DRAFTS_PATH = process.env.DRAFTS_PATH || '/home/paranthaman/Projects/automated-blogger/drafts';
const VERCEL_DAILY_QUOTA = parseInt(process.env.VERCEL_DAILY_QUOTA || '100', 10);
const PUBLISH_LOG_PATH = path.join(DRAFTS_PATH, '.publish-log.json');
const QUOTA_LOG_PATH = path.join(DRAFTS_PATH, '.quota-log.json');

async function getPublishLog() {
  try {
    const data = await fs.readFile(PUBLISH_LOG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function savePublishLog(log) {
  await fs.writeFile(PUBLISH_LOG_PATH, JSON.stringify(log, null, 2));
}

async function getQuotaLog() {
  try {
    const data = await fs.readFile(QUOTA_LOG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return { date: null, used: 0 };
    throw err;
  }
}

async function saveQuotaLog(log) {
  await fs.writeFile(QUOTA_LOG_PATH, JSON.stringify(log, null, 2));
}

async function getTodayQuotaUsed() {
  const log = await getQuotaLog();
  const today = new Date().toISOString().split('T')[0];
  
  if (log.date !== today) {
    return 0;
  }
  
  return log.used || 0;
}

async function incrementQuotaUsed(count = 1) {
  const today = new Date().toISOString().split('T')[0];
  const log = await getQuotaLog();
  
  if (log.date !== today) {
    log.date = today;
    log.used = 0;
  }
  
  log.used += count;
  await saveQuotaLog(log);
  return log.used;
}

router.get('/status', async (req, res) => {
  try {
    const approvedPath = path.join(DRAFTS_PATH, 'approved');
    const files = await fs.readdir(approvedPath).catch(() => []);
    const stagedCount = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx')).length;
    
    const quotaUsed = await getTodayQuotaUsed();
    const quotaRemaining = VERCEL_DAILY_QUOTA - quotaUsed;
    
    res.json({
      stagedCount,
      quotaLimit: VERCEL_DAILY_QUOTA,
      quotaUsed,
      quotaRemaining,
      canPublish: stagedCount > 0 && quotaRemaining > 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/preview', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Preview mode initiated. Run `npm run dev` in blog directory to preview locally.',
      hint: 'cd /home/paranthaman/Projects/automated-blogger/blog && npm run dev'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/publish', async (req, res) => {
  try {
    const approvedPath = path.join(DRAFTS_PATH, 'approved');
    const publishedPath = path.join(DRAFTS_PATH, 'published');
    
    const files = await fs.readdir(approvedPath).catch(() => []);
    const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    
    if (mdFiles.length === 0) {
      return res.status(400).json({ error: 'No drafts staged for publishing' });
    }
    
    const quotaUsed = await getTodayQuotaUsed();
    const quotaRemaining = VERCEL_DAILY_QUOTA - quotaUsed;
    
    if (quotaRemaining < 1) {
      return res.status(429).json({ error: 'Daily Vercel quota exceeded' });
    }
    
    await fs.mkdir(publishedPath, { recursive: true });
    
    const moved = [];
    for (const file of mdFiles) {
      const sourcePath = path.join(approvedPath, file);
      const destPath = path.join(publishedPath, file);
      await fs.rename(sourcePath, destPath);
      moved.push(file);
    }
    
    const newQuotaUsed = await incrementQuotaUsed(1);
    
    const publishLog = await getPublishLog();
    publishLog.unshift({
      timestamp: new Date().toISOString(),
      filesPublished: moved,
      count: moved.length,
      quotaUsedAfter: newQuotaUsed
    });
    await savePublishLog(publishLog.slice(0, 50));
    
    res.json({
      success: true,
      message: `Published ${moved.length} draft(s)`,
      filesPublished: moved,
      quotaUsed: newQuotaUsed,
      quotaRemaining: VERCEL_DAILY_QUOTA - newQuotaUsed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/publish-log', async (req, res) => {
  try {
    const log = await getPublishLog();
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vercel/quota', async (req, res) => {
  try {
    const quotaUsed = await getTodayQuotaUsed();
    const quotaRemaining = VERCEL_DAILY_QUOTA - quotaUsed;
    
    res.json({
      limit: VERCEL_DAILY_QUOTA,
      used: quotaUsed,
      remaining: quotaRemaining,
      date: new Date().toISOString().split('T')[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
