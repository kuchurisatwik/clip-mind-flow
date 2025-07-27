// Injected script - runs in the page context to capture copy events
(function() {
  'use strict';
  
  console.log('ClipMaster injected script loaded');
  
  let lastCopiedContent = '';
  
  // Listen for copy events
  document.addEventListener('copy', handleCopyEvent, true);
  
  // Listen for cut events (also capture content being cut)
  document.addEventListener('cut', handleCutEvent, true);
  
  // Monitor clipboard changes using Clipboard API (when available)
  if (navigator.clipboard && navigator.clipboard.readText) {
    startClipboardMonitoring();
  }
  
  function handleCopyEvent(event) {
    try {
      // Get the selected text
      const selection = window.getSelection();
      const selectedText = selection.toString();
      
      // Get clipboard data if available
      let clipboardData = '';
      if (event.clipboardData) {
        clipboardData = event.clipboardData.getData('text/plain');
      }
      
      // Use the most relevant content
      const content = selectedText || clipboardData;
      
      if (content && content.trim() && content !== lastCopiedContent) {
        lastCopiedContent = content;
        
        // Send to content script
        window.postMessage({
          type: 'CLIPMASTER_COPY_EVENT',
          content: content.trim(),
          method: 'copy_event',
          timestamp: Date.now(),
          url: window.location.href
        }, '*');
      }
    } catch (error) {
      console.error('ClipMaster copy event error:', error);
    }
  }
  
  function handleCutEvent(event) {
    try {
      const selection = window.getSelection();
      const selectedText = selection.toString();
      
      if (selectedText && selectedText.trim() && selectedText !== lastCopiedContent) {
        lastCopiedContent = selectedText;
        
        window.postMessage({
          type: 'CLIPMASTER_COPY_EVENT',
          content: selectedText.trim(),
          method: 'cut_event',
          timestamp: Date.now(),
          url: window.location.href
        }, '*');
      }
    } catch (error) {
      console.error('ClipMaster cut event error:', error);
    }
  }
  
  // Clipboard monitoring (for browsers that support it)
  function startClipboardMonitoring() {
    let lastClipboardContent = '';
    
    // Check clipboard every 2 seconds when page is focused
    setInterval(async () => {
      if (document.hasFocus()) {
        try {
          const clipboardText = await navigator.clipboard.readText();
          
          if (clipboardText && 
              clipboardText.trim() && 
              clipboardText !== lastClipboardContent && 
              clipboardText !== lastCopiedContent) {
            
            lastClipboardContent = clipboardText;
            lastCopiedContent = clipboardText;
            
            window.postMessage({
              type: 'CLIPMASTER_COPY_EVENT',
              content: clipboardText.trim(),
              method: 'clipboard_monitor',
              timestamp: Date.now(),
              url: window.location.href
            }, '*');
          }
        } catch (error) {
          // Clipboard access denied or not available
          // This is normal and expected in many cases
        }
      }
    }, 2000);
  }
  
  // Handle programmatic copy operations
  const originalExecCommand = document.execCommand;
  document.execCommand = function(command, showUI, value) {
    const result = originalExecCommand.apply(this, arguments);
    
    if (command === 'copy' || command === 'cut') {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText && selectedText.trim() && selectedText !== lastCopiedContent) {
          lastCopiedContent = selectedText;
          
          window.postMessage({
            type: 'CLIPMASTER_COPY_EVENT',
            content: selectedText.trim(),
            method: `execCommand_${command}`,
            timestamp: Date.now(),
            url: window.location.href
          }, '*');
        }
      }, 100);
    }
    
    return result;
  };
  
  // Override Clipboard API writeText method
  if (navigator.clipboard && navigator.clipboard.writeText) {
    const originalWriteText = navigator.clipboard.writeText;
    navigator.clipboard.writeText = function(text) {
      if (text && text.trim() && text !== lastCopiedContent) {
        lastCopiedContent = text;
        
        window.postMessage({
          type: 'CLIPMASTER_COPY_EVENT',
          content: text.trim(),
          method: 'clipboard_api',
          timestamp: Date.now(),
          url: window.location.href
        }, '*');
      }
      
      return originalWriteText.apply(this, arguments);
    };
  }
})();