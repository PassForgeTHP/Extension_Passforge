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

    // Detect login forms
    function detectLoginForms() {
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
        }
      });

      console.log(`Detected ${loginForms.length} login form(s)`);
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
