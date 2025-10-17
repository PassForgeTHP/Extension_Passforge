/**
 * Service for inter-script communication
 * Handles sending and receiving messages between content scripts, popup, and background
 */

import { createMessage, isValidMessageType } from './messageTypes.js';

/**
 * Send a message to the background script
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {object} payload - Data to send with the message
 * @returns {Promise} Response from background script
 */
export async function sendMessage(type, payload = {}) {
  if (!isValidMessageType(type)) {
    throw new Error(`Invalid message type: ${type}`);
  }

  const message = createMessage(type, payload);

  try {
    const response = await browser.runtime.sendMessage(message);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Send a message to a specific tab
 * @param {number} tabId - Target tab ID
 * @param {string} type - Message type from MESSAGE_TYPES
 * @param {object} payload - Data to send with the message
 * @returns {Promise} Response from the tab
 */
export async function sendMessageToTab(tabId, type, payload = {}) {
  if (!isValidMessageType(type)) {
    throw new Error(`Invalid message type: ${type}`);
  }

  const message = createMessage(type, payload);

  try {
    const response = await browser.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    console.error('Error sending message to tab:', error);
    throw error;
  }
}

/**
 * Listen for messages from other scripts
 * @param {function} handler - Function to handle incoming messages
 * @returns {function} Cleanup function to remove the listener
 */
export function onMessage(handler) {
  const listener = (message, sender, sendResponse) => {
    // Validate message structure
    if (!message || !message.type) {
      return false;
    }

    // Validate message type
    if (!isValidMessageType(message.type)) {
      console.warn('Received message with invalid type:', message.type);
      return false;
    }

    // Call the handler and handle async responses
    const result = handler(message, sender, sendResponse);

    // If handler returns a promise, keep the channel open
    if (result instanceof Promise) {
      result
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep channel open for async response
    }

    // If handler returns true, keep channel open for manual sendResponse
    return result === true;
  };

  browser.runtime.onMessage.addListener(listener);

  // Return cleanup function
  return () => {
    browser.runtime.onMessage.removeListener(listener);
  };
}
