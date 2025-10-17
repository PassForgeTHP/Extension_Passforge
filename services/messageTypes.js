/**
 * Message types for inter-script communication
 * Used by content scripts, popup, and background script
 */

export const MESSAGE_TYPES = {
  // Password operations
  GET_PASSWORD: 'GET_PASSWORD',
  SAVE_PASSWORD: 'SAVE_PASSWORD',

  // Vault operations
  LOCK_VAULT: 'LOCK_VAULT',
  UNLOCK_VAULT: 'UNLOCK_VAULT',
  SYNC_VAULT: 'SYNC_VAULT',
};

/**
 * Create a standardized message object
 */
export function createMessage(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Check if a message has a valid type
 */
export function isValidMessageType(type) {
  return Object.values(MESSAGE_TYPES).includes(type);
}
