// Popup script for ClipMaster AI Extension

document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});

async function initializePopup() {
  const contentDiv = document.getElementById('content');
  
  try {
    // Check authentication status
    const authStatus = await checkAuthStatus();
    
    if (!authStatus.authenticated) {
      showAuthPrompt(contentDiv);
    } else {
      await showDashboard(contentDiv);
    }
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError(contentDiv, 'Failed to load ClipMaster');
  }
}

function showAuthPrompt(container) {
  container.innerHTML = `
    <div class="auth-section">
      <div class="auth-icon">🔐</div>
      <div class="auth-title">Authentication Required</div>
      <div class="auth-description">
        Please log in to ClipMaster to start capturing your clipboard history.
      </div>
      <button class="button primary" id="login-button">
        Open ClipMaster & Login
      </button>
    </div>
  `;
  
  document.getElementById('login-button').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://your-clipmaster-app.lovable.app/auth' });
    window.close();
  });
}

async function showDashboard(container) {
  try {
    // Get recent clips and stats
    const [clips, stats] = await Promise.all([
      getRecentClips(),
      getClipStats()
    ]);
    
    const isEnabled = await getExtensionStatus();
    
    container.innerHTML = `
      <div class="status">
        <div class="status-indicator ${isEnabled ? '' : 'disabled'}"></div>
        <span>Capture ${isEnabled ? 'Enabled' : 'Disabled'}</span>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.total || 0}</div>
          <div class="stat-label">Total Clips</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.today || 0}</div>
          <div class="stat-label">Today</div>
        </div>
      </div>
      
      <div class="recent-clips">
        <div class="section-title">Recent Clips</div>
        ${clips.length > 0 ? 
          clips.slice(0, 3).map(clip => `
            <div class="clip-item" data-clip-id="${clip.id}">
              <div>${truncateText(clip.content, 80)}</div>
              <div class="clip-meta">
                <span class="clip-type">${clip.type}</span>
                <span>${formatTime(clip.created_at)}</span>
              </div>
            </div>
          `).join('') : 
          '<div style="text-align: center; opacity: 0.6; padding: 20px; font-size: 12px;">No clips yet</div>'
        }
      </div>
      
      <div class="actions">
        <button class="button" id="toggle-capture">
          ${isEnabled ? 'Disable' : 'Enable'} Capture
        </button>
        <button class="button" id="clear-clips">
          Clear History
        </button>
      </div>
    `;
    
    // Add event listeners for dashboard actions
    setupDashboardEvents();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showError(container, 'Failed to load dashboard');
  }
}

function setupDashboardEvents() {
  // Toggle capture
  const toggleBtn = document.getElementById('toggle-capture');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', async () => {
      const currentStatus = await getExtensionStatus();
      await setExtensionStatus(!currentStatus);
      initializePopup(); // Refresh
    });
  }
  
  // Clear clips
  const clearBtn = document.getElementById('clear-clips');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all clips?')) {
        await clearAllClips();
        initializePopup(); // Refresh
      }
    });
  }
  
  // Click on clip to copy
  document.querySelectorAll('.clip-item').forEach(item => {
    item.addEventListener('click', async () => {
      const clipId = item.dataset.clipId;
      const clip = await getClipById(clipId);
      if (clip) {
        await navigator.clipboard.writeText(clip.content);
        showToast('Copied to clipboard!');
      }
    });
  });
}

function setupEventListeners() {
  // Open dashboard
  document.getElementById('open-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://your-clipmaster-app.lovable.app/' });
    window.close();
  });
  
  // Settings
  document.getElementById('settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    window.close();
  });
  
  // Help
  document.getElementById('help').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://docs.clipmaster.ai' });
    window.close();
  });
}

// API Functions
async function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" }, resolve);
  });
}

async function getRecentClips() {
  const authStatus = await checkAuthStatus();
  if (!authStatus.authenticated) return [];
  
  try {
    const response = await fetch('https://dpjzrtwahmbnlxmwnuvc.supabase.co/rest/v1/clips?order=created_at.desc&limit=5', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwanpydHdhaG1ibmx4bXdudXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTIzMzMsImV4cCI6MjA2OTEyODMzM30.Mga7qsXM390FSz8bAQa2xXSOer65FWG2ezFKSffVAg0',
        'Authorization': `Bearer ${authStatus.token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching clips:', error);
  }
  
  return [];
}

async function getClipStats() {
  const clips = await getRecentClips();
  const today = new Date().toDateString();
  
  return {
    total: clips.length,
    today: clips.filter(clip => new Date(clip.created_at).toDateString() === today).length
  };
}

async function getClipById(id) {
  const clips = await getRecentClips();
  return clips.find(clip => clip.id === id);
}

async function getExtensionStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['clipmaster_enabled'], (result) => {
      resolve(result.clipmaster_enabled !== false); // Default to true
    });
  });
}

async function setExtensionStatus(enabled) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ clipmaster_enabled: enabled }, resolve);
  });
}

async function clearAllClips() {
  // This would require a backend endpoint to clear user's clips
  // For now, just clear local storage
  chrome.storage.local.clear();
}

// Utility functions
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function showError(container, message) {
  container.innerHTML = `
    <div class="auth-section">
      <div class="auth-icon">⚠️</div>
      <div class="auth-title">Error</div>
      <div class="auth-description">${message}</div>
      <button class="button" onclick="initializePopup()">
        Retry
      </button>
    </div>
  `;
}

function showToast(message) {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    zIndex: '10000'
  });
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}