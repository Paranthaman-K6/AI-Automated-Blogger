const API_BASE = '/api';
const POLL_INTERVAL = 5000;

let pollTimer = null;

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

async function updateStatus() {
  try {
    const health = await fetchAPI('/health');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusDot.classList.add('online');
    statusText.textContent = 'Online';
  } catch (err) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusDot.classList.remove('online');
    statusText.textContent = 'Offline';
  }
}

async function updateQuota() {
  try {
    const quota = await fetchAPI('/batch/vercel/quota');
    
    document.getElementById('quotaUsed').textContent = quota.used;
    document.getElementById('quotaLimit').textContent = quota.limit;
    document.getElementById('quotaRemaining').textContent = quota.remaining;
    
    const percentage = (quota.used / quota.limit) * 100;
    document.getElementById('quotaProgress').style.width = `${percentage}%`;
  } catch (err) {
    console.error('Failed to update quota:', err);
  }
}

async function updateBatchStatus() {
  try {
    const status = await fetchAPI('/batch/status');
    
    document.getElementById('stagedCount').textContent = status.stagedCount;
    
    const publishBtn = document.getElementById('publishBtn');
    publishBtn.disabled = !status.canPublish;
  } catch (err) {
    console.error('Failed to update batch status:', err);
  }
}

async function updateDrafts() {
  try {
    const drafts = await fetchAPI('/drafts');
    
    renderPendingDrafts(drafts.pending);
    renderApprovedDrafts(drafts.approved);
  } catch (err) {
    console.error('Failed to update drafts:', err);
  }
}

function renderPendingDrafts(drafts) {
  const container = document.getElementById('pendingDrafts');
  
  if (drafts.length === 0) {
    container.innerHTML = '<div class="empty-state">No pending drafts</div>';
    return;
  }
  
  container.innerHTML = drafts.map(draft => `
    <div class="draft-card">
      <div class="draft-header">
        <div class="draft-title">${escapeHtml(draft.title)}</div>
        <div class="draft-meta">
          <span>${draft.wordCount} words</span>
          <span class="badge badge-success">Ready</span>
        </div>
      </div>
      <div class="draft-actions">
        <button class="btn btn-secondary btn-sm" onclick="previewDraft('${draft.id}')">Preview</button>
        <button class="btn btn-success btn-sm" onclick="approveDraft('${draft.id}')">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="rejectDraft('${draft.id}')">Reject</button>
      </div>
    </div>
  `).join('');
}

function renderApprovedDrafts(drafts) {
  const container = document.getElementById('approvedDrafts');
  
  if (drafts.length === 0) {
    container.innerHTML = '<div class="empty-state">No approved drafts</div>';
    return;
  }
  
  container.innerHTML = drafts.map(draft => `
    <div class="draft-item">
      <div>
        <div style="font-weight: 600; color: var(--slate-100);">${escapeHtml(draft.title)}</div>
        <div style="font-size: 0.875rem; color: var(--slate-400);">${draft.wordCount} words</div>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button class="btn btn-secondary btn-sm" onclick="previewDraft('${draft.id}')">Preview</button>
        <span class="badge badge-warning">Staged</span>
      </div>
    </div>
  `).join('');
}

async function updatePublishLog() {
  try {
    const log = await fetchAPI('/batch/publish-log');
    const container = document.getElementById('publishLog');
    
    if (log.length === 0) {
      container.innerHTML = '<div class="empty-state">No deployments yet</div>';
      return;
    }
    
    container.innerHTML = log.slice(0, 10).map(entry => `
      <div class="log-entry">
        <div class="log-timestamp">${new Date(entry.timestamp).toLocaleString()}</div>
        <div class="log-details">
          Published ${entry.count} draft(s) | Quota used: ${entry.quotaUsedAfter}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to update publish log:', err);
  }
}

function previewDraft(id) {
  window.open(`/preview/${encodeURIComponent(id)}`, '_blank', 'noopener');
}

async function approveDraft(id) {
  try {
    await fetchAPI(`/drafts/${id}/approve`, { method: 'POST' });
    showToast('Draft approved successfully');
    await refresh();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function rejectDraft(id) {
  const reason = prompt('Rejection reason (optional):');
  
  try {
    await fetchAPI(`/drafts/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || '' })
    });
    showToast('Draft rejected');
    await refresh();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function previewBatch() {
  try {
    const result = await fetchAPI('/batch/preview', { method: 'POST' });
    showToast(result.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function publishBatch() {
  if (!confirm('Publish all staged drafts to production?')) {
    return;
  }
  
  try {
    const result = await fetchAPI('/batch/publish', { method: 'POST' });
    showToast(result.message);
    await refresh();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function refresh() {
  await Promise.all([
    updateStatus(),
    updateQuota(),
    updateBatchStatus(),
    updateDrafts(),
    updatePublishLog()
  ]);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(refresh, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refresh();
  startPolling();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPolling();
  } else {
    refresh();
    startPolling();
  }
});
