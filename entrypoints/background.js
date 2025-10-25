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
    console.log('[DEBUG] PassForge background script loaded');

    try {
      console.log('[DEBUG] Background script initializing...');

      // Attempt to restore session when service worker starts
      // This keeps the vault unlocked across service worker restarts
      (async () => {
        console.log('[DEBUG] Attempting to restore vault session');
        const store = useVaultStore.getState();
        console.log('[DEBUG] Vault store initialized in background');

        const result = await store.restoreFromSession();
        if (result.success) {
          console.log('[DEBUG] [Background] Vault session restored successfully');
        } else {
          console.log('[DEBUG] [Background] No session to restore:', result.error);
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

    // Auto-lock timer setup
    const AUTO_LOCK_ALARM = 'passforge-auto-lock';
    const AUTO_LOCK_MINUTES = 2; // Auto-lock after 2 minutes of inactivity

    // Listen for alarm events
    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name === AUTO_LOCK_ALARM) {
        console.log('[Background] Auto-lock timer triggered');
        const store = useVaultStore.getState();
        if (!store.isLocked) {
          await store.autoLock();
          console.log('[Background] Vault auto-locked after', AUTO_LOCK_MINUTES, 'minutes');
        }
      }
    });

    console.log('[Background] Auto-lock timer configured (' + AUTO_LOCK_MINUTES + ' minutes)');


    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      if (message.type === "STORE_TOKEN") {
        chrome.storage.local.set({ token: message.token });
        console.log("Token received and stored :", message.token);
        sendResponse({ success: true });
      }
    });

    chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
      if (message.type === "CLEAR_TOKEN") {
        chrome.storage.local.remove("token");
        sendResponse({ success: true });
      }
    });

    } catch (error) {
      console.error('[DEBUG] Error in background script initialization:', error);
    }

  },
});
