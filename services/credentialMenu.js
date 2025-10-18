/**
 * Credential Menu Service
 *
 * Displays a dropdown menu with available credentials when user clicks
 * on the PassForge icon next to input fields.
 */

import { sendMessage } from './messageService.js';
import { MESSAGE_TYPES } from './messageTypes.js';

/**
 * Creates and displays a credential dropdown menu
 * @param {HTMLElement} anchorElement - The element to position the menu relative to
 * @param {string} domain - The current domain
 * @param {Function} onSelect - Callback when a credential is selected
 */
export async function showCredentialMenu(anchorElement, domain, onSelect) {
  // Remove any existing menu first
  removeCredentialMenu();

  // Request credentials from background
  const response = await sendMessage(MESSAGE_TYPES.AUTO_FILL_REQUEST, { domain });

  if (!response || !response.success || !response.credentials) {
    // Check if error is due to locked vault
    const isVaultLocked = response?.error && response.error.toLowerCase().includes('locked');
    showNoCredentialsMessage(anchorElement, isVaultLocked);
    return;
  }

  const credentials = response.credentials;

  if (credentials.length === 0) {
    showNoCredentialsMessage(anchorElement, false);
    return;
  }

  // Create the menu
  const menu = createMenuElement(credentials, domain, onSelect);

  // Position the menu
  positionMenu(menu, anchorElement);

  // Add to DOM
  document.body.appendChild(menu);

  // Close menu when clicking outside or on blur
  const closeHandler = (event) => {
    // Check if click is outside menu and not on any input field
    if (!menu.contains(event.target) && event.target !== anchorElement) {
      removeCredentialMenu();
      document.removeEventListener('click', closeHandler, true);
      document.removeEventListener('focusin', focusHandler, true);
    }
  };

  // Close menu when focus moves to another field
  const focusHandler = (event) => {
    const isInputField = event.target.tagName === 'INPUT';
    if (isInputField && !menu.contains(event.target)) {
      removeCredentialMenu();
      document.removeEventListener('click', closeHandler, true);
      document.removeEventListener('focusin', focusHandler, true);
    }
  };

  // Delay adding the handlers to prevent immediate closure
  setTimeout(() => {
    document.addEventListener('click', closeHandler, true);
    document.addEventListener('focusin', focusHandler, true);
  }, 100);

  console.log('[CredentialMenu] Menu displayed with', credentials.length, 'credential(s)');
}

/**
 * Creates the menu DOM element
 * @param {Array} credentials - List of credentials to display
 * @param {string} domain - Current domain
 * @param {Function} onSelect - Selection callback
 * @returns {HTMLElement} The menu element
 */
function createMenuElement(credentials, domain, onSelect) {
  const menu = document.createElement('div');
  menu.className = 'passforge-credential-menu';
  menu.style.cssText = `
    position: fixed;
    background: white;
    border: 2px solid #af0024;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(175, 0, 36, 0.15);
    min-width: 250px;
    max-width: 350px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    font-size: 14px;
  `;

  // Add header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 8px 12px;
    background: #af0024;
    border-bottom: none;
    font-weight: 600;
    color: white;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 4px 4px 0 0;
  `;
  header.textContent = 'PassForge';
  menu.appendChild(header);

  // Filter credentials matching domain
  const matchingCredentials = credentials.filter(cred =>
    cred.domain && cred.domain.toLowerCase().includes(domain.toLowerCase())
  );

  // Add credential items
  matchingCredentials.forEach(credential => {
    const item = createCredentialItem(credential, onSelect);
    menu.appendChild(item);
  });

  return menu;
}

/**
 * Creates a single credential menu item
 * @param {Object} credential - The credential data
 * @param {Function} onSelect - Selection callback
 * @returns {HTMLElement} The menu item element
 */
function createCredentialItem(credential, onSelect) {
  const item = document.createElement('div');
  item.className = 'passforge-credential-item';
  item.style.cssText = `
    padding: 10px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f6f8fa;
    transition: background-color 0.1s ease;
  `;

  // Display title and username
  const title = document.createElement('div');
  title.style.cssText = `
    font-weight: 500;
    color: #24292f;
    margin-bottom: 2px;
  `;
  title.textContent = credential.title || credential.domain || 'Untitled';

  const username = document.createElement('div');
  username.style.cssText = `
    font-size: 12px;
    color: #57606a;
  `;
  username.textContent = credential.username || 'No username';

  item.appendChild(title);
  item.appendChild(username);

  // Hover effect
  item.addEventListener('mouseenter', () => {
    item.style.backgroundColor = 'rgba(175, 0, 36, 0.08)';
  });
  item.addEventListener('mouseleave', () => {
    item.style.backgroundColor = 'transparent';
  });

  // Click handler
  item.addEventListener('click', (event) => {
    event.stopPropagation();
    onSelect(credential);
    removeCredentialMenu();
  });

  return item;
}

/**
 * Shows a message when no credentials are available
 * @param {HTMLElement} anchorElement - Element to position message relative to
 * @param {boolean} isVaultLocked - Whether the vault is locked
 */
function showNoCredentialsMessage(anchorElement, isVaultLocked = false) {
  const menu = document.createElement('div');
  menu.className = 'passforge-credential-menu';
  menu.style.cssText = `
    position: fixed;
    background: white;
    border: 2px solid #af0024;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(175, 0, 36, 0.15);
    padding: 16px;
    min-width: 200px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    color: #af0024;
    text-align: center;
  `;

  // Different message based on vault state
  if (isVaultLocked) {
    menu.textContent = 'Unlock vault to view and save passwords';
  } else {
    menu.textContent = 'No saved credentials for this site';
  }

  positionMenu(menu, anchorElement);
  document.body.appendChild(menu);

  // Auto-close after 2 seconds
  setTimeout(() => {
    removeCredentialMenu();
  }, 2000);

  // Close on click outside or field change
  const closeHandler = (event) => {
    if (!menu.contains(event.target)) {
      removeCredentialMenu();
      document.removeEventListener('click', closeHandler, true);
      document.removeEventListener('focusin', focusHandler, true);
    }
  };

  const focusHandler = (event) => {
    const isInputField = event.target.tagName === 'INPUT';
    if (isInputField && !menu.contains(event.target)) {
      removeCredentialMenu();
      document.removeEventListener('click', closeHandler, true);
      document.removeEventListener('focusin', focusHandler, true);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeHandler, true);
    document.addEventListener('focusin', focusHandler, true);
  }, 100);
}

/**
 * Positions the menu relative to the anchor element
 * @param {HTMLElement} menu - The menu to position
 * @param {HTMLElement} anchorElement - The anchor element
 */
function positionMenu(menu, anchorElement) {
  const rect = anchorElement.getBoundingClientRect();

  // Position below the anchor by default
  let top = rect.bottom + 4;
  let left = rect.left;

  // Adjust if menu would go off-screen
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

/**
 * Removes the credential menu from the DOM
 */
export function removeCredentialMenu() {
  const existingMenu = document.querySelector('.passforge-credential-menu');
  if (existingMenu) {
    existingMenu.remove();
    console.log('[CredentialMenu] Menu removed');
  }
}
