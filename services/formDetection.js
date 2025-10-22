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
  // console.log(`Found ${passwordInputs.length} password field(s)`);
  return Array.from(passwordInputs);
}

/**
 * Detect username/email input fields on the page
 * Uses multiple selectors to catch different field types
 * @returns {HTMLInputElement[]} Array of username/email input elements
 */
export function detectUsernameFields() {
  const usernameSelectors = [
    // Type-based selectors
    'input[type="email"]',

    // Name attribute patterns (with and without type restriction)
    'input[type="text"][name*="user" i]',
    'input[type="text"][name*="email" i]',
    'input[type="text"][name*="login" i]',
    'input[name*="user" i]',
    'input[name*="email" i]',
    'input[name*="login" i]',

    // ID attribute patterns
    'input[type="text"][id*="user" i]',
    'input[type="text"][id*="email" i]',
    'input[type="text"][id*="login" i]',
    'input[id*="user" i]',
    'input[id*="email" i]',
    'input[id*="login" i]',

    // Placeholder patterns (common for React forms)
    'input[placeholder*="email" i]',
    'input[placeholder*="user" i]',
    'input[placeholder*="login" i]',

    // Class name patterns
    'input[class*="email" i]',
    'input[class*="user" i]',
    'input[class*="login" i]',

    // Autocomplete attributes
    'input[autocomplete="username"]',
    'input[autocomplete="email"]'
  ];

  const usernameInputs = document.querySelectorAll(usernameSelectors.join(','));

  // Filter out password fields, hidden fields, and non-visible fields
  const filtered = Array.from(usernameInputs).filter(input => {
    return input.type !== 'password' &&
           input.type !== 'hidden' &&
           input.type !== 'checkbox' &&
           input.offsetParent !== null;
  });

  // console.log(`Found ${filtered.length} potential username/email field(s)`);
  return filtered;
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

  // console.log(`Detected ${loginForms.length} login form(s)`);
  return loginForms;
}

/**
 * Injects PassForge icon next to an input field
 * @param {HTMLInputElement} field - The input field
 * @param {string} fieldType - Type of field ('username' or 'password')
 * @param {Function} onIconClick - Optional callback when icon is clicked
 */
export function injectPassForgeIcon(field, fieldType, onIconClick) {
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
      <path fill="#af0024" d="M12 17a2 2 0 0 1-2-2c0-1.11.89-2 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2m6 3V10H6v10zm0-12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3"/>
    </svg>
  `;

  // Position icon using fixed positioning to avoid modifying parent styles
  const positionIcon = () => {
    const rect = field.getBoundingClientRect();
    icon.style.cssText = `
      position: fixed;
      left: ${rect.right - 26}px;
      top: ${rect.top + rect.height / 2 - 9}px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      pointer-events: auto;
      opacity: 0;
      transition: opacity 0.2s;
    `;
  };

  // Initial positioning (hidden)
  positionIcon();

  // Update position on scroll and resize to keep icon aligned with field
  const updatePosition = () => {
    if (document.body.contains(field)) {
      positionIcon();
    } else {
      // Field was removed from DOM, clean up icon and listeners
      icon.remove();
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    }
  };

  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);

  // Show icon only when field is focused
  field.addEventListener('focus', () => {
    icon.style.opacity = '1';
    icon.style.pointerEvents = 'auto';
  });

  field.addEventListener('blur', () => {
    // Delay hiding to allow clicking the icon
    setTimeout(() => {
      icon.style.opacity = '0';
      icon.style.pointerEvents = 'none';
    }, 200);
  });

  // Add hover effect
  icon.addEventListener('mouseenter', () => {
    icon.style.opacity = '1';
  });

  // Add click handler if provided
  if (onIconClick) {
    icon.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      onIconClick(icon, field, fieldType);
    });
  }

  // Append icon to document body (not field parent) to avoid layout interference
  document.body.appendChild(icon);

  // console.log(`[FormDetection] Icon injected for ${fieldType} field`);
}

/**
 * Removes all PassForge icons from the page
 */
export function removeAllIcons() {
  const icons = document.querySelectorAll('.passforge-icon');
  icons.forEach((icon) => icon.remove());
  // console.log('[FormDetection] All icons removed');
}

/**
 * Initializes form detection and icon injection
 * @param {string} currentDomain - The current domain
 * @param {Function} onIconClick - Optional callback when icon is clicked
 * @returns {Array<Object>} Detected forms
 */
export function initFormDetection(currentDomain, onIconClick) {
  const forms = detectLoginForms(currentDomain);

  forms.forEach((formData) => {
    if (formData.usernameField) {
      injectPassForgeIcon(formData.usernameField, 'username', onIconClick);
    }
    if (formData.passwordField) {
      injectPassForgeIcon(formData.passwordField, 'password', onIconClick);
    }
  });

  // console.log(`[FormDetection] Initialized, ${forms.length} form(s) detected`);

  return forms;
}
