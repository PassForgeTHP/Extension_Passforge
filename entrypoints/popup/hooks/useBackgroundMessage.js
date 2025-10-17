/**
 * React hook for popup to background communication
 * Provides easy access to send messages to the background script
 */

import { sendMessage } from '../../../services/messageService.js';
import { MESSAGE_TYPES } from '../../../services/messageTypes.js';

/**
 * Custom hook to send messages from popup to background
 * @returns {Object} Object with message sending functions
 */
export function useBackgroundMessage() {
  /**
   * Lock the vault via background script
   * @returns {Promise<Object>} Response from background
   */
  const lockVault = async () => {
    try {
      const response = await sendMessage(MESSAGE_TYPES.LOCK_VAULT);
      return response;
    } catch (error) {
      console.error('Failed to lock vault:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Unlock the vault via background script
   * @param {string} masterPassword - Master password to unlock
   * @returns {Promise<Object>} Response from background
   */
  const unlockVault = async (masterPassword) => {
    try {
      const response = await sendMessage(MESSAGE_TYPES.UNLOCK_VAULT, { masterPassword });
      return response;
    } catch (error) {
      console.error('Failed to unlock vault:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get passwords for a specific domain via background script
   * @param {string} domain - Domain to search for
   * @returns {Promise<Object>} Response with passwords array
   */
  const getPasswordsForDomain = async (domain) => {
    try {
      const response = await sendMessage(MESSAGE_TYPES.GET_PASSWORD, { domain });
      return response;
    } catch (error) {
      console.error('Failed to get passwords:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Save a new password via background script
   * @param {Object} passwordData - Password data to save
   * @returns {Promise<Object>} Response confirming save
   */
  const savePassword = async (passwordData) => {
    try {
      const response = await sendMessage(MESSAGE_TYPES.SAVE_PASSWORD, passwordData);
      return response;
    } catch (error) {
      console.error('Failed to save password:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Sync vault with backend via background script
   * @returns {Promise<Object>} Response confirming sync
   */
  const syncVault = async () => {
    try {
      const response = await sendMessage(MESSAGE_TYPES.SYNC_VAULT);
      return response;
    } catch (error) {
      console.error('Failed to sync vault:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    lockVault,
    unlockVault,
    getPasswordsForDomain,
    savePassword,
    syncVault,
  };
}
