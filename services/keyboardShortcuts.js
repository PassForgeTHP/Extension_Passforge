/**
 * Keyboard Shortcuts Service
 *
 * Manages keyboard shortcuts for the PassForge extension.
 * Currently handles Ctrl+Shift+P for triggering auto-fill functionality.
 */

/**
 * Callback function type for keyboard shortcuts
 * @callback ShortcutCallback
 * @param {KeyboardEvent} event - The keyboard event that triggered the shortcut
 */

/**
 * Checks if the auto-fill keyboard shortcut is pressed
 * Shortcut: Ctrl+Shift+P (or Cmd+Shift+P on Mac)
 * @param {KeyboardEvent} event - The keyboard event to check
 * @returns {boolean} True if the auto-fill shortcut is pressed
 */
export function isAutoFillShortcut(event) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? event.metaKey : event.ctrlKey;

  return (
    modifierKey &&
    event.shiftKey &&
    event.key.toLowerCase() === 'p' &&
    !event.altKey
  );
}

/**
 * Initializes keyboard shortcut listeners
 * @param {ShortcutCallback} onAutoFill - Callback to execute when auto-fill shortcut is triggered
 * @returns {Function} Cleanup function to remove the listener
 */
export function initKeyboardShortcuts(onAutoFill) {
  /**
   * Keyboard event handler
   * @param {KeyboardEvent} event - The keyboard event
   */
  const handleKeyPress = (event) => {
    // Check for auto-fill shortcut
    if (isAutoFillShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();

      console.log('[KeyboardShortcuts] Auto-fill shortcut triggered');

      if (typeof onAutoFill === 'function') {
        onAutoFill(event);
      }
    }
  };

  // Add event listener
  document.addEventListener('keydown', handleKeyPress, true);

  console.log('[KeyboardShortcuts] Initialized (Ctrl+Shift+P or Cmd+Shift+P)');

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyPress, true);
    console.log('[KeyboardShortcuts] Cleanup completed');
  };
}

/**
 * Gets a human-readable description of the auto-fill shortcut
 * @returns {string} The shortcut description
 */
export function getAutoFillShortcutDescription() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd+Shift+P' : 'Ctrl+Shift+P';
}
