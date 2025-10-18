/**
 * Content script for PassForge extension
 * Runs on all web pages to detect login forms and interact with them
 * - Detects password and username fields
 * - Communicates with background script to get/save passwords
 * - Adds visual indicators to detected fields
 */

import { sendMessage } from '../services/messageService.js';
import { MESSAGE_TYPES } from '../services/messageTypes.js';
import { detectLoginForms, initFormDetection } from '../services/formDetection.js';
import { addVisualIndicator } from '../services/fieldIndicators.js';
import { initKeyboardShortcuts } from '../services/keyboardShortcuts.js';
import { autoFillForm, findMatchingCredential, extractDomain } from '../services/autoFillService.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('PassForge content script loaded');

    // Extract current domain
    const currentDomain = window.location.hostname;
    console.log(`Current domain: ${currentDomain}`);

    // Store detected forms for auto-fill
    let detectedForms = [];

    // Request passwords for current domain from background script
    async function requestPasswordsForDomain() {
      try {
        // Send message to background script requesting passwords for this domain
        const response = await sendMessage(MESSAGE_TYPES.GET_PASSWORD, {
          domain: currentDomain
        });

        if (response.success) {
          console.log(`Found ${response.count} password(s) for ${currentDomain}`);
          return response.passwords;
        } else {
          console.log('Could not retrieve passwords:', response.error);
          return [];
        }
      } catch (error) {
        console.error('Error requesting passwords:', error);
        return [];
      }
    }

    // Detect and handle login forms on the page
    async function handleLoginForms() {
      // Use the imported initFormDetection function to inject icons
      const loginForms = initFormDetection(currentDomain);

      // Also add visual indicators
      loginForms.forEach(({ usernameField, passwordField }) => {
        addVisualIndicator(usernameField);
        addVisualIndicator(passwordField);
      });

      // Store detected forms for auto-fill
      detectedForms = loginForms;

      // If forms were detected, request saved passwords from background
      if (loginForms.length > 0) {
        await requestPasswordsForDomain();
      }

      return loginForms;
    }

    // Handle auto-fill when keyboard shortcut is triggered
    async function handleAutoFill() {
      if (detectedForms.length === 0) {
        console.log('[AutoFill] No forms detected on this page');
        return;
      }

      try {
        // Request credentials from background script
        const response = await sendMessage(MESSAGE_TYPES.AUTO_FILL_REQUEST, {
          domain: currentDomain
        });

        if (response && response.success && response.credentials) {
          // Find matching credential for current domain
          const matchingCredential = findMatchingCredential(
            response.credentials,
            currentDomain
          );

          if (matchingCredential) {
            // Show confirmation dialog
            const confirmed = confirm(
              `Fill with PassForge?\n\nUsername: ${matchingCredential.username}\nDomain: ${matchingCredential.domain}`
            );

            if (confirmed) {
              // Fill the first detected form
              const firstForm = detectedForms[0];
              autoFillForm(
                matchingCredential,
                firstForm.usernameField,
                firstForm.passwordField
              );
              console.log('[AutoFill] Form filled successfully');
            }
          } else {
            console.log('[AutoFill] No matching credentials found for', currentDomain);
            alert('No saved credentials found for this domain.');
          }
        } else {
          console.log('[AutoFill] No credentials available');
          alert('No saved credentials found.');
        }
      } catch (error) {
        console.error('[AutoFill] Error during auto-fill:', error);
        alert('Auto-fill failed. Please try again.');
      }
    }

    // Run detection when page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleLoginForms);
    } else {
      handleLoginForms();
    }

    // Watch for dynamic forms (SPA apps)
    const observer = new MutationObserver(() => {
      handleLoginForms();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initialize keyboard shortcuts for auto-fill (Ctrl+Shift+P or Cmd+Shift+P)
    const cleanupKeyboardShortcuts = initKeyboardShortcuts(handleAutoFill);

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      cleanupKeyboardShortcuts();
    });
  },
});
