// Content script - runs on all web pages
console.log('ClipMaster AI Extension loaded');

let isClipMasterEnabled = true;
let lastCopiedContent = '';

// Initialize extension
init();

async function init() {
  // Check if user is authenticated
  const authStatus = await checkAuthStatus();
  if (!authStatus.authenticated) {
    console.log('User not authenticated with ClipMaster');
    return;
  }
  
  // Inject script to capture copy events
  injectCopyCapture();
  
  // Listen for keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Listen for messages from injected script
  window.addEventListener('message', handleInjectedMessage);
}

// Check authentication status
function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" }, resolve);
  });
}

// Inject script to capture copy events (bypasses some security restrictions)
function injectCopyCapture() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  // Ctrl+Shift+V - Quick save current selection
  if (event.ctrlKey && event.shiftKey && event.key === 'V') {
    event.preventDefault();
    saveCurrentSelection();
  }
  
  // Ctrl+Shift+C - Toggle ClipMaster capture
  if (event.ctrlKey && event.shiftKey && event.key === 'C') {
    event.preventDefault();
    toggleClipMaster();
  }
}

// Save current text selection
async function saveCurrentSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText && selectedText !== lastCopiedContent) {
    await saveToClipMaster({
      content: selectedText,
      sourceUrl: window.location.href,
      captureMethod: 'manual_selection'
    });
  }
}

// Toggle ClipMaster capture on/off
function toggleClipMaster() {
  isClipMasterEnabled = !isClipMasterEnabled;
  
  // Show visual feedback
  showNotification(
    isClipMasterEnabled ? 'ClipMaster capture enabled' : 'ClipMaster capture disabled',
    isClipMasterEnabled ? 'success' : 'info'
  );
  
  // Update extension badge
  chrome.runtime.sendMessage({
    type: 'UPDATE_BADGE',
    enabled: isClipMasterEnabled
  });
}

// Handle messages from injected script
async function handleInjectedMessage(event) {
  if (event.source !== window) return;
  if (event.data.type !== 'CLIPMASTER_COPY_EVENT') return;
  
  if (!isClipMasterEnabled) return;
  
  const { content, method } = event.data;
  
  // Avoid duplicates
  if (content === lastCopiedContent) return;
  lastCopiedContent = content;
  
  await saveToClipMaster({
    content,
    sourceUrl: window.location.href,
    captureMethod: method
  });
}

// Save content to ClipMaster
async function saveToClipMaster(data) {
  if (!data.content || data.content.trim().length === 0) return;
  
  const clipData = {
    content: data.content.trim(),
    type: detectContentType(data.content),
    priority: determinePriority(data.content),
    sourceUrl: data.sourceUrl,
    captureMethod: data.captureMethod || 'copy_event'
  };
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_CLIP",
      data: clipData
    });
    
    if (response.success) {
      console.log('Clip saved successfully:', response.data);
      showNotification('Content saved to ClipMaster!', 'success');
    } else {
      console.error('Failed to save clip:', response.error);
      showNotification('Failed to save content', 'error');
    }
  } catch (error) {
    console.error('Error communicating with background script:', error);
  }
}

// Detect content type
function detectContentType(content) {
  // URL detection
  if (/^https?:\/\//i.test(content)) {
    return "link";
  }
  
  // Code detection
  const codePatterns = [
    /^(function|const|let|var|class|import|export)/,
    /[\{\};\(\)]/,
    /^<[^>]+>/,
    /^\s*(\/\/|\/\*|\*|#)/,
    /\b(console\.log|document\.|window\.)/
  ];
  
  if (codePatterns.some(pattern => pattern.test(content))) {
    return "code";
  }
  
  // Image URL detection
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(content)) {
    return "image";
  }
  
  return "text";
}

// Determine priority based on content
function determinePriority(content) {
  // High priority indicators
  const highPriorityKeywords = [
    'password', 'secret', 'api key', 'token', 'urgent', 'important', 
    'deadline', 'meeting', 'error', 'bug', 'fix'
  ];
  
  // Medium priority indicators  
  const mediumPriorityKeywords = [
    'todo', 'note', 'reminder', 'link', 'reference', 'code'
  ];
  
  const lowerContent = content.toLowerCase();
  
  if (highPriorityKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'high';
  }
  
  if (mediumPriorityKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

// Show visual notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.clipmaster-notification');
  if (existing) existing.remove();
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `clipmaster-notification clipmaster-${type}`;
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '10000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'clipmaster-slide-in 0.3s ease-out'
  });
  
  // Add animation styles
  if (!document.querySelector('#clipmaster-styles')) {
    const styles = document.createElement('style');
    styles.id = 'clipmaster-styles';
    styles.textContent = `
      @keyframes clipmaster-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes clipmaster-slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'clipmaster-slide-out 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}