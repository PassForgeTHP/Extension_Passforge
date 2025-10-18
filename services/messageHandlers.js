/**
 * Message handlers for background script
 * Contains the logic for handling each message type
 */

import { MESSAGE_TYPES } from './messageTypes.js';
import useVaultStore from './vaultStore.js';

/**
 * Handle GET_PASSWORD message
 * Retrieves password(s) for a specific domain
 *
 * @param {Object} payload - Contains { domain: string }
 * @returns {Promise<Object>} Response with matching passwords
 */
async function handleGetPassword({ domain }) {
  try {
    // Get the vault store instance
    const store = useVaultStore.getState();

    // Check if vault is locked
    if (store.isLocked) {
      return {
        success: false,
        error: 'Vault is locked. Please unlock first.',
      };
    }

    // Search for passwords matching the domain
    const passwords = store.passwords.filter(pwd =>
      pwd.domain && pwd.domain.toLowerCase().includes(domain.toLowerCase())
    );

    return {
      success: true,
      passwords,
      count: passwords.length,
    };
  } catch (error) {
    console.error('Error handling GET_PASSWORD:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle SAVE_PASSWORD message
 * Saves a new password to the vault
 *
 * @param {Object} payload - Password data { domain, username, password, title, notes }
 * @returns {Promise<Object>} Response with saved password
 */
async function handleSavePassword(payload) {
  try {
    // Get the vault store instance
    const store = useVaultStore.getState();

    // Check if vault is locked
    if (store.isLocked) {
      return {
        success: false,
        error: 'Vault is locked. Please unlock first.',
      };
    }

    // Validate required fields
    if (!payload.domain || !payload.password) {
      return {
        success: false,
        error: 'Domain and password are required.',
      };
    }

    // Add password to vault
    const result = await store.addPassword(payload);

    return result;
  } catch (error) {
    console.error('Error handling SAVE_PASSWORD:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle LOCK_VAULT message
 * Locks the vault and clears sensitive data from RAM
 *
 * @returns {Promise<Object>} Response confirming vault is locked
 */
async function handleLockVault() {
  try {
    // Get the vault store instance
    const store = useVaultStore.getState();

    // Lock the vault (clears passwords and keys from RAM)
    await store.lock();

    // Clear auto-lock alarm when manually locked
    const AUTO_LOCK_ALARM = 'passforge-auto-lock';
    chrome.alarms.clear(AUTO_LOCK_ALARM);
    console.log('[MessageHandler] Auto-lock alarm cleared');

    return {
      success: true,
      message: 'Vault locked successfully.',
    };
  } catch (error) {
    console.error('Error handling LOCK_VAULT:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle UNLOCK_VAULT message
 * Unlocks the vault using the master password
 * Decrypts passwords and loads them into RAM
 *
 * @param {Object} payload - Contains { masterPassword: string }
 * @returns {Promise<Object>} Response confirming unlock status
 */
async function handleUnlockVault({ masterPassword }) {
  try {
    // Validate master password is provided
    if (!masterPassword) {
      return {
        success: false,
        error: 'Master password is required.',
      };
    }

    // Get the vault store instance
    const store = useVaultStore.getState();

    // Attempt to unlock the vault
    const result = await store.unlock(masterPassword);

    // Schedule auto-lock alarm if unlock was successful
    if (result.success) {
      const AUTO_LOCK_ALARM = 'passforge-auto-lock';
      const AUTO_LOCK_MINUTES = 2;

      chrome.alarms.create(AUTO_LOCK_ALARM, {
        delayInMinutes: AUTO_LOCK_MINUTES
      });
      console.log('[MessageHandler] Auto-lock scheduled for', AUTO_LOCK_MINUTES, 'minutes');
    }

    return result;
  } catch (error) {
    console.error('Error handling UNLOCK_VAULT:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle SYNC_VAULT message
 * Synchronizes the local vault with the backend API
 *
 * @returns {Promise<Object>} Response confirming sync status
 */
async function handleSyncVault() {
  try {
    // TODO: Implement API sync logic
    // This will be implemented when backend sync endpoints are ready
    // For now, return a placeholder response

    return {
      success: false,
      error: 'Sync not yet implemented. Coming soon!',
    };
  } catch (error) {
    console.error('Error handling SYNC_VAULT:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle AUTO_FILL_REQUEST message
 * Retrieves all credentials for auto-fill functionality
 * The content script will then match credentials to the current domain
 *
 * @param {Object} payload - Contains { domain: string }
 * @returns {Promise<Object>} Response with all credentials
 */
async function handleAutoFillRequest({ domain }) {
  try {
    // Get the vault store instance
    const store = useVaultStore.getState();

    // Check if vault is locked
    if (store.isLocked) {
      return {
        success: false,
        error: 'Vault is locked. Please unlock first.',
      };
    }

    // Get all passwords for matching in content script
    // We send all passwords and let the content script find the best match
    const credentials = store.passwords;

    console.log(`[AutoFill] Providing ${credentials.length} credentials for domain: ${domain}`);

    return {
      success: true,
      credentials,
      domain,
    };
  } catch (error) {
    console.error('Error handling AUTO_FILL_REQUEST:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main message router
 * Routes incoming messages to the appropriate handler
 *
 * @param {Object} message - The message object with type and payload
 * @returns {Promise<Object>} Response from the handler
 */
export async function handleMessage(message) {
  const { type, payload } = message;

  // Route to appropriate handler based on message type
  switch (type) {
    case MESSAGE_TYPES.GET_PASSWORD:
      return handleGetPassword(payload);

    case MESSAGE_TYPES.SAVE_PASSWORD:
      return handleSavePassword(payload);

    case MESSAGE_TYPES.LOCK_VAULT:
      return handleLockVault();

    case MESSAGE_TYPES.UNLOCK_VAULT:
      return handleUnlockVault(payload);

    case MESSAGE_TYPES.SYNC_VAULT:
      return handleSyncVault();

    case MESSAGE_TYPES.AUTO_FILL_REQUEST:
      return handleAutoFillRequest(payload);

    default:
      // This should never happen if messageService validates types correctly
      return {
        success: false,
        error: `Unknown message type: ${type}`,
      };
  }
}
