/**
 * Background script for PassForge extension
 * Runs persistently in the background and handles:
 * - Inter-script communication (content scripts, popup)
 * - Vault operations (unlock, lock, password management)
 * - Extension lifecycle events (install, update)
 */

import { onMessage } from '../services/messageService.js';
import { handleMessage } from '../services/messageHandlers.js';
import useVaultStore from '../services/vaultStore.js';

export default defineBackground({
  main() {
    console.log('PassForge background script loaded');

    // Attempt to restore session when service worker starts
    // This keeps the vault unlocked across service worker restarts
    (async () => {
      const store = useVaultStore.getState();
      const result = await store.restoreFromSession();
      if (result.success) {
        console.log('[Background] Vault session restored');
      } else {
        console.log('[Background] No session to restore');
      }
    })();

    // Listen for extension installation or update events
    // This is useful for initializing data or showing welcome screens
    browser.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.log('Extension installed');
        // TODO: Could open welcome page or setup wizard here
      } else if (details.reason === 'update') {
        console.log('Extension updated');
        // TODO: Could show changelog or migration logic here
      }
    });

    // Setup centralized message listener for inter-script communication
    // This handles ALL messages from content scripts and popup
    // Messages are validated and routed to appropriate handlers
    onMessage(async (message, sender, sendResponse) => {
      // Log incoming message for debugging
      // sender.tab exists if message comes from content script, undefined if from popup
      const source = sender.tab ? 'content script' : 'popup';
      console.log('Received message:', message.type, 'from', source);

      // Route the message to the appropriate handler based on message type
      // handleMessage() returns a promise with the response
      const response = await handleMessage(message);

      // Return response to the sender
      // The response format is always { success: boolean, ... }
      return response;
    });

    console.log('Message handlers initialized and ready');
  },
});
