/**
 * Content script for PassForge extension
 * Runs on all web pages to detect login forms and interact with them
 * - Detects password and username fields
 * - Communicates with background script to get/save passwords
 * - Adds visual indicators to detected fields
 */

import { sendMessage } from '../services/messageService.js';
import { MESSAGE_TYPES } from '../services/messageTypes.js';
import { detectLoginForms } from '../services/formDetection.js';
import { addVisualIndicator } from '../services/fieldIndicators.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('PassForge content script loaded');

    // Extract current domain
    const currentDomain = window.location.hostname;
    console.log(`Current domain: ${currentDomain}`);

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
      // Use the imported detectLoginForms function from formDetection module
      const loginForms = detectLoginForms(currentDomain);

      // Add visual indicators to detected fields
      loginForms.forEach(({ usernameField, passwordField }) => {
        addVisualIndicator(usernameField);
        addVisualIndicator(passwordField);
      });

      // If forms were detected, request saved passwords from background
      if (loginForms.length > 0) {
        await requestPasswordsForDomain();
      }

      return loginForms;
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
  },
});
