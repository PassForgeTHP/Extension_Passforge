/**
 * Session Service
 * Manages encrypted master key storage in session storage
 * Persists across service worker restarts but clears on browser close
 */

const SESSION_KEY = 'passforge_session';

/**
 * Save session data to chrome.storage.session
 * @param {Object} sessionData - Session data to save (masterKey, salt, iv, unlockTime)
 */
export async function saveSession(sessionData) {
  try {
    await chrome.storage.session.set({
      [SESSION_KEY]: {
        ...sessionData,
        savedAt: Date.now()
      }
    });
    console.log('[Session] Session saved');
  } catch (error) {
    console.error('[Session] Failed to save session:', error);
    throw error;
  }
}

/**
 * Get session data from chrome.storage.session
 * @returns {Promise<Object|null>} Session data or null if not found
 */
export async function getSession() {
  try {
    const result = await chrome.storage.session.get(SESSION_KEY);
    return result[SESSION_KEY] || null;
  } catch (error) {
    console.error('[Session] Failed to get session:', error);
    return null;
  }
}

/**
 * Clear session data from chrome.storage.session
 */
export async function clearSession() {
  try {
    await chrome.storage.session.remove(SESSION_KEY);
    console.log('[Session] Session cleared');
  } catch (error) {
    console.error('[Session] Failed to clear session:', error);
    throw error;
  }
}

/**
 * Check if session exists and is valid
 * @returns {Promise<boolean>} True if session exists
 */
export async function hasSession() {
  const session = await getSession();
  return session !== null;
}
