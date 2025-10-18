/**
 * Auto-fill Service
 *
 * Handles automatic form filling functionality for login forms.
 * This service manages the detection of fillable fields and populates
 * them with stored credentials from the vault.
 */

/**
 * Fills a form field with the provided value
 * Dispatches events to ensure compatibility with modern frameworks (React, Vue, etc.)
 * @param {HTMLInputElement} field - The input field to fill
 * @param {string} value - The value to fill into the field
 */
function fillField(field, value) {
  if (!field || !value) return;

  // Set the value using native input setter to trigger React/framework events
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  nativeInputValueSetter.call(field, value);

  // Dispatch input event to notify frameworks (React, Vue, etc.)
  const inputEvent = new Event('input', { bubbles: true });
  field.dispatchEvent(inputEvent);

  // Dispatch change event for traditional forms
  const changeEvent = new Event('change', { bubbles: true });
  field.dispatchEvent(changeEvent);
}

/**
 * Auto-fills a login form with provided credentials
 * @param {Object} credentials - The credentials object containing username and password
 * @param {string} credentials.username - The username to fill
 * @param {string} credentials.password - The decrypted password to fill
 * @param {HTMLInputElement} usernameField - The username input field
 * @param {HTMLInputElement} passwordField - The password input field
 */
export function autoFillForm(credentials, usernameField, passwordField) {
  if (!credentials) {
    console.warn('[AutoFill] No credentials provided');
    return;
  }

  // Fill username field if provided
  if (usernameField && credentials.username) {
    fillField(usernameField, credentials.username);
    console.log('[AutoFill] Username field filled');
  }

  // Fill password field if provided
  // Note: Password should be decrypted before calling this function
  if (passwordField && credentials.password) {
    fillField(passwordField, credentials.password);
    console.log('[AutoFill] Password field filled');
  }
}

/**
 * Finds the best matching credential for the current domain
 * @param {Array} credentials - Array of stored credentials
 * @param {string} currentDomain - The current page domain
 * @returns {Object|null} The best matching credential or null
 */
export function findMatchingCredential(credentials, currentDomain) {
  if (!credentials || credentials.length === 0) {
    return null;
  }

  // First, try exact domain match
  const exactMatch = credentials.find(cred =>
    cred.domain && cred.domain.toLowerCase() === currentDomain.toLowerCase()
  );

  if (exactMatch) {
    return exactMatch;
  }

  // If no exact match, try to find a credential with domain contained in current URL
  const partialMatch = credentials.find(cred => {
    if (!cred.domain) return false;
    const credDomain = cred.domain.toLowerCase();
    const currentLower = currentDomain.toLowerCase();
    return currentLower.includes(credDomain) || credDomain.includes(currentLower);
  });

  return partialMatch || null;
}

/**
 * Extracts the domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The extracted domain
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('[AutoFill] Invalid URL:', error);
    return '';
  }
}
