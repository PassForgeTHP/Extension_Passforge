export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('PassForge content script loaded');

    // Example: Detect password input fields
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    console.log(`Found ${passwordInputs.length} password fields`);

    // You can add your password detection and autofill logic here
  },
});
