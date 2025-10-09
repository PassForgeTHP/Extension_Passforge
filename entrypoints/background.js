export default defineBackground({
  main() {
    console.log('PassForge background script loaded');

    // Listen for extension installation or update
    browser.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.log('Extension installed');
      } else if (details.reason === 'update') {
        console.log('Extension updated');
      }
    });

    // Example: Listen for messages from content scripts or popup
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Received message:', message);

      // Handle different message types
      if (message.type === 'GET_PASSWORDS') {
        // Your password retrieval logic here
        sendResponse({ success: true, data: [] });
      }

      return true; // Keep the message channel open for async response
    });
  },
});
