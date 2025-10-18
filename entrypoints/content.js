/**
 * Content script for PassForge extension
 * Runs on all web pages to detect login forms and interact with them
 * - Detects password and username fields
 * - Communicates with background script to get/save passwords
 * - Adds visual indicators to detected fields
 */

import { sendMessage } from '../services/messageService.js';
import { MESSAGE_TYPES } from '../services/messageTypes.js';
import { detectLoginForms, injectPassForgeIcon } from '../services/formDetection.js';
import { initKeyboardShortcuts } from '../services/keyboardShortcuts.js';
import { autoFillForm, findMatchingCredential, extractDomain } from '../services/autoFillService.js';
import { showCredentialMenu } from '../services/credentialMenu.js';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('PassForge content script loaded');

    // Extract current domain
    const currentDomain = window.location.hostname;
    console.log(`Current domain: ${currentDomain}`);

    // Store detected forms for auto-fill
    let detectedForms = [];
    let isDetecting = false;

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
      // Prevent concurrent detection to avoid infinite loops
      if (isDetecting) {
        return detectedForms;
      }

      isDetecting = true;

      try {
        // Detect login forms first
        const loginForms = detectLoginForms(currentDomain);

        // Store detected forms before setting up click handlers (needed for closure)
        detectedForms = loginForms;

        // Create click handler for PassForge icons
        const handleIconClick = async (icon, field, fieldType) => {
          // Find the form containing this field
          const formData = detectedForms.find(form =>
            form.usernameField === field || form.passwordField === field
          );

          if (!formData) {
            console.log('[IconClick] Could not find form for field');
            return;
          }

          // Show credential menu
          await showCredentialMenu(icon, currentDomain, (selectedCredential) => {
            // Auto-fill the form with selected credential
            autoFillForm(
              selectedCredential,
              formData.usernameField,
              formData.passwordField
            );
            console.log('[IconClick] Form filled with selected credential');
          });
        };

        // Inject icons for new forms only
        loginForms.forEach(({ usernameField, passwordField }) => {
          // Check if icon already exists to prevent re-injection
          const usernameHasIcon = usernameField?.parentElement?.querySelector('.passforge-icon') ||
                                   document.querySelector(`.passforge-icon[data-field-id="${usernameField?.id}"]`);
          const passwordHasIcon = passwordField?.parentElement?.querySelector('.passforge-icon') ||
                                   document.querySelector(`.passforge-icon[data-field-id="${passwordField?.id}"]`);

          if (usernameField && !usernameHasIcon) {
            injectPassForgeIcon(usernameField, 'username', handleIconClick);

            // Auto-open dropdown on field focus
            usernameField.addEventListener('focus', async () => {
              const icon = document.querySelector(`.passforge-icon[data-field-type="username"]`);
              if (icon) {
                await handleIconClick(icon, usernameField, 'username');
              }
            }, { once: false });
          }

          if (passwordField && !passwordHasIcon) {
            injectPassForgeIcon(passwordField, 'password', handleIconClick);

            // Auto-open dropdown on field focus
            passwordField.addEventListener('focus', async () => {
              const icon = document.querySelector(`.passforge-icon[data-field-type="password"]`);
              if (icon) {
                await handleIconClick(icon, passwordField, 'password');
              }
            }, { once: false });
          }
        });

        // If forms were detected, request saved passwords from background
        if (loginForms.length > 0) {
          await requestPasswordsForDomain();
        }

        return loginForms;
      } finally {
        isDetecting = false;
      }
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

    // Watch for dynamic forms (SPA apps) with debounce
    let mutationTimeout;
    const observer = new MutationObserver((mutations) => {
      // Ignore mutations caused by PassForge itself
      const hasPassForgeChanges = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
          node.classList?.contains('passforge-icon') ||
          node.classList?.contains('passforge-credential-menu') ||
          node.classList?.contains('passforge-indicator')
        )
      );

      if (hasPassForgeChanges) {
        return; // Don't re-detect if we just injected our own elements
      }

      // Debounce to avoid excessive re-detection
      clearTimeout(mutationTimeout);
      mutationTimeout = setTimeout(() => {
        handleLoginForms();
      }, 500);
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
