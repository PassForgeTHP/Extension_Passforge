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

/**
 * Injects PassForge icon next to an input field
 * @param {HTMLInputElement} field - The input field
 * @param {string} fieldType - Type of field ('username' or 'password')
 */
export function injectPassForgeIcon(field, fieldType) {
  if (!field) return;

  // Check if icon already exists
  const existingIcon = field.parentElement?.querySelector('.passforge-icon');
  if (existingIcon) {
    return; // Icon already injected
  }

  // Create icon element with SVG
  const icon = document.createElement('span');
  icon.className = 'passforge-icon';
  icon.setAttribute('data-field-type', fieldType);
  icon.title = `PassForge can fill this ${fieldType} field (Ctrl+Shift+P)`;

  // Using Material Design Icons lock icon (mdi:lock-outline)
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4F46E5" d="M12 17a2 2 0 0 1-2-2c0-1.11.89-2 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2m6 3V10H6v10zm0-12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3"/>
    </svg>
  `;

  // Style the icon
  icon.style.cssText = `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: auto;
    opacity: 0.7;
    transition: opacity 0.2s;
  `;

  // Add hover effect
  icon.addEventListener('mouseenter', () => {
    icon.style.opacity = '1';
  });
  icon.addEventListener('mouseleave', () => {
    icon.style.opacity = '0.7';
  });

  // Make parent position relative if it's not already positioned
  const parent = field.parentElement;
  if (parent) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
    }
  }

  // Insert icon after the field
  field.parentElement?.appendChild(icon);

  console.log(`[FormDetection] Icon injected for ${fieldType} field`);
}

/**
 * Removes all PassForge icons from the page
 */
export function removeAllIcons() {
  const icons = document.querySelectorAll('.passforge-icon');
  icons.forEach((icon) => icon.remove());
  console.log('[FormDetection] All icons removed');
}

/**
 * Initializes form detection and icon injection
 * @param {string} currentDomain - The current domain
 * @returns {Array<Object>} Detected forms
 */
export function initFormDetection(currentDomain) {
  const forms = detectLoginForms(currentDomain);

  forms.forEach((formData) => {
    if (formData.usernameField) {
      injectPassForgeIcon(formData.usernameField, 'username');
    }
    if (formData.passwordField) {
      injectPassForgeIcon(formData.passwordField, 'password');
    }
  });

  console.log(`[FormDetection] Initialized, ${forms.length} form(s) detected`);

  return forms;
}
