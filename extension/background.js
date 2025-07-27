// Background service worker for ClipMaster AI Extension

const SUPABASE_URL = "https://dpjzrtwahmbnlxmwnuvc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwanpydHdhaG1ibmx4bXdudXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTIzMzMsImV4cCI6MjA2OTEyODMzM30.Mga7qsXM390FSz8bAQa2xXSOer65FWG2ezFKSffVAg0";

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('ClipMaster AI Extension installed');
  
  // Create context menu
  chrome.contextMenus.create({
    id: "saveToClipmaster",
    title: "Save to ClipMaster",
    contexts: ["selection", "link", "image"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "saveToClipmaster") {
    let content = "";
    let type = "text";
    let sourceUrl = tab.url;
    
    if (info.selectionText) {
      content = info.selectionText;
      type = detectContentType(content);
    } else if (info.linkUrl) {
      content = info.linkUrl;
      type = "link";
    } else if (info.srcUrl) {
      content = info.srcUrl;
      type = "image";
    }
    
    await saveClipToSupabase({
      content,
      type,
      sourceUrl,
      priority: "medium"
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "SAVE_CLIP") {
    try {
      const result = await saveClipToSupabase(message.data);
      sendResponse({ success: true, data: result });
      
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ClipMaster AI',
        message: 'Content saved to clipboard history!'
      });
    } catch (error) {
      console.error('Error saving clip:', error);
      sendResponse({ success: false, error: error.message });
    }
  } else if (message.type === "GET_AUTH_STATUS") {
    const authToken = await getAuthToken();
    sendResponse({ authenticated: !!authToken, token: authToken });
  }
  
  return true; // Keep the message channel open for async response
});

// Save clip to Supabase
async function saveClipToSupabase(clipData) {
  const authToken = await getAuthToken();
  
  if (!authToken) {
    throw new Error('User not authenticated');
  }
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/clips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${authToken}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      content: clipData.content,
      type: clipData.type,
      priority: clipData.priority,
      source_url: clipData.sourceUrl,
      summary: generateSummary(clipData.content, clipData.type),
      tags: extractTags(clipData.content)
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Get auth token from storage
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['supabase_auth_token'], (result) => {
      resolve(result.supabase_auth_token || null);
    });
  });
}

// Detect content type
function detectContentType(content) {
  // URL detection
  const urlRegex = /^https?:\/\//i;
  if (urlRegex.test(content)) {
    return "link";
  }
  
  // Code detection (basic patterns)
  const codePatterns = [
    /^(function|const|let|var|class|import|export)/,
    /[\{\};\(\)]/,
    /^<[^>]+>/,
    /^\s*(\/\/|\/\*|\*|#)/
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

// Generate summary
function generateSummary(content, type) {
  if (type === "link") return "Web link";
  if (type === "code") return "Code snippet";
  if (type === "image") return "Image content";
  
  const words = content.split(' ').slice(0, 8).join(' ');
  return words.length < content.length ? words + "..." : words;
}

// Extract tags from content
function extractTags(content) {
  const tags = [];
  
  // Extract hashtags
  const hashtags = content.match(/#\w+/g);
  if (hashtags) {
    tags.push(...hashtags.map(tag => tag.slice(1)));
  }
  
  // Extract common programming keywords
  const keywords = ['javascript', 'python', 'react', 'css', 'html', 'api', 'function', 'class'];
  keywords.forEach(keyword => {
    if (content.toLowerCase().includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return tags.length > 0 ? tags : null;
}