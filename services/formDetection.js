/**
 * Form detection service for content script
 * Detects login forms and their input fields on web pages
 */

/**
 * Detect password input fields on the page
 * @returns {HTMLInputElement[]} Array of password input elements
 */
export function detectPasswordFields() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  console.log(`Found ${passwordInputs.length} password field(s)`);
  return Array.from(passwordInputs);
}

/**
 * Detect username/email input fields on the page
 * Uses multiple selectors to catch different field types
 * @returns {HTMLInputElement[]} Array of username/email input elements
 */
export function detectUsernameFields() {
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

/**
 * Detect complete login forms on the page
 * Matches username and password fields within the same form
 * @param {string} currentDomain - The current domain for context
 * @returns {Object[]} Array of login form objects with form, usernameField, passwordField, domain
 */
export function detectLoginForms(currentDomain) {
  const passwordFields = detectPasswordFields();
  const usernameFields = detectUsernameFields();

  const loginForms = [];

  passwordFields.forEach(passwordField => {
    // Find the parent form or use document.body as fallback
    const form = passwordField.closest('form') || document.body;

    // Find matching username field in the same form
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
    }
  });

  console.log(`Detected ${loginForms.length} login form(s)`);
  return loginForms;
}
