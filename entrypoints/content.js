/**
 * Content script for PassForge extension
 * Runs on all web pages to detect login forms and interact with them
 * - Detects password and username fields
 * - Communicates with background script to get/save passwords
 * - Adds visual indicators to detected fields
 */

import { sendMessage } from '../services/messageService.js';
import { MESSAGE_TYPES } from '../services/messageTypes.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('PassForge content script loaded');

    // Extract current domain
    const currentDomain = window.location.hostname;
    console.log(`Current domain: ${currentDomain}`);

    // Detect password input fields
    function detectPasswordFields() {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      console.log(`Found ${passwordInputs.length} password field(s)`);
      return Array.from(passwordInputs);
    }

    // Detect username/email input fields
    function detectUsernameFields() {
      const usernameSelectors = [
        'input[type="email"]',
        'input[type="text"][name*="user" i]',
        'input[type="text"][name*="email" i]',
        'input[type="text"][name*="login" i]',
        'input[type="text"][id*="user" i]',
        'input[type="text"][id*="email" i]',
        'input[type="text"][id*="login" i]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]'
      ];

      const usernameInputs = document.querySelectorAll(usernameSelectors.join(','));
      console.log(`Found ${usernameInputs.length} potential username/email field(s)`);
      return Array.from(usernameInputs);
    }

    // Add visual indicator to detected fields
    function addVisualIndicator(field) {
      if (field.dataset.passforgeDetected) return; // Already marked

      field.dataset.passforgeDetected = 'true';
      field.style.outline = '2px solid #3498db';
      field.style.outlineOffset = '2px';

      // Add icon to the field
      const icon = document.createElement('span');
      icon.textContent = '🔐';
      icon.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        font-size: 16px;
        z-index: 10000;
      `;

      // Make parent relative if needed
      const parent = field.parentElement;
      if (parent && getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }

      field.parentElement?.appendChild(icon);
    }

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

    // Detect login forms
    async function detectLoginForms() {
      const passwordFields = detectPasswordFields();
      const usernameFields = detectUsernameFields();

      const loginForms = [];

      passwordFields.forEach(passwordField => {
        const form = passwordField.closest('form') || document.body;
        const usernameField = usernameFields.find(field =>
          form.contains(field) && field.offsetParent !== null
        );

        if (usernameField) {
          loginForms.push({
            form,
            usernameField,
            passwordField,
            domain: currentDomain
          });

          // Add visual indicators
          addVisualIndicator(usernameField);
          addVisualIndicator(passwordField);
        }
      });

      console.log(`Detected ${loginForms.length} login form(s)`);

      // If forms were detected, request saved passwords from background
      if (loginForms.length > 0) {
        await requestPasswordsForDomain();
      }

      return loginForms;
    }

    // Run detection when page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', detectLoginForms);
    } else {
      detectLoginForms();
    }

    // Watch for dynamic forms (SPA apps)
    const observer = new MutationObserver(() => {
      detectLoginForms();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
});
