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
  // Ensure the message type is valid before sending
  if (!isValidMessageType(type)) {
    throw new Error(`Invalid message type: ${type}`);
  }

  // Create a standardized message object with type, payload, and timestamp
  const message = createMessage(type, payload);

  try {
    // Send message to background script using browser.runtime API
    // Works across Chrome, Firefox, Edge, and Safari
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
  // Ensure the message type is valid before sending
  if (!isValidMessageType(type)) {
    throw new Error(`Invalid message type: ${type}`);
  }

  // Create a standardized message object with type, payload, and timestamp
  const message = createMessage(type, payload);

  try {
    // Send message to a specific tab's content script
    // Useful for background script to communicate with a specific webpage
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
    // Validate message structure - ensure it has required properties
    if (!message || !message.type) {
      return false;
    }

    // Validate message type - ensure it's one of our defined types
    if (!isValidMessageType(message.type)) {
      console.warn('Received message with invalid type:', message.type);
      return false;
    }

    // Call the user-provided handler with message, sender info, and response callback
    const result = handler(message, sender, sendResponse);

    // If handler returns a promise, automatically handle the async response
    // This allows handlers to use async/await syntax
    if (result instanceof Promise) {
      result
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response
    }

    // If handler returns true explicitly, keep channel open for manual sendResponse call
    return result === true;
  };

  // Register the listener with the browser runtime
  browser.runtime.onMessage.addListener(listener);

  // Return cleanup function to remove the listener when no longer needed
  return () => {
    browser.runtime.onMessage.removeListener(listener);
  };
}
