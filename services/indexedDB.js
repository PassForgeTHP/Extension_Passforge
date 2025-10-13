// Database configuration
const DB_NAME = 'PassForgeDB'  // Name of the IndexedDB database
const DB_VERSION = 1            // Version number (increment when changing structure)

// Store names - Using constants to avoid typos
const STORES = {
  VAULT: 'vault',       // Single record: encrypted vault from backend
  CACHE: 'cache',       // Multiple records: local copy of passwords for performance
  FOLDERS: 'folders',   // Multiple records: password organization
  SETTINGS: 'settings', // Key-value: user preferences (theme, language, etc.)
  SESSION: 'session'    // Key-value: temporary data (token, isUnlocked, etc.)
}

/**
 * Initialize IndexedDB database with all required stores
 * This function opens or creates the PassForgeDB database
 * @returns {Promise<IDBDatabase>} The database instance
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    // Open the database (creates it if doesn't exist)
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // Handle errors when opening the database
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    // Handle successful database opening
    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    // Handle database creation/upgrade (called only on first run or version change)
    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create vault store (single record for encrypted vault)
      // keyPath: 'id' means each record will be identified by its 'id' field
      // Example: { id: 'main', encryptedData: '...', salt: '...' }
      if (!db.objectStoreNames.contains(STORES.VAULT)) {
        db.createObjectStore(STORES.VAULT, { keyPath: 'id' })
      }

      // Create cache store (multiple records with folderId index)
      // The index allows fast lookup of all passwords in a specific folder
      // Example: { id: 1, title: 'GitHub', username: 'user@example.com', folderId: 'work' }
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'id' })
        // Create index on folderId (unique: false means multiple records can share same folderId)
        cacheStore.createIndex('folderId', 'folderId', { unique: false })
      }

      // Create folders store (multiple records)
      // Example: { id: 'work', name: 'Work', color: '#ff0000' }
      if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
        db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' })
      }

      // Create settings store (key-value pairs)
      // Example: { key: 'theme', value: 'dark' }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
      }

      // Create session store (key-value pairs for temporary data)
      // Example: { key: 'isUnlocked', value: true }
      if (!db.objectStoreNames.contains(STORES.SESSION)) {
        db.createObjectStore(STORES.SESSION, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Get a store from the database
 * Helper function to access a specific store within a transaction
 * @param {string} storeName - Name of the store to access
 * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
 * @returns {Promise<IDBObjectStore>} The object store
 */
const getStore = async (storeName, mode = 'readonly') => {
  // Open/create the database
  const db = await initDB()
  // Start a transaction (required for all IndexedDB operations)
  const transaction = db.transaction(storeName, mode)
  // Return the specific store from the transaction
  return transaction.objectStore(storeName)
}

// ============================================
// VAULT OPERATIONS (Single record)
// The vault store contains ONE record with the encrypted master vault
// ============================================

export const vaultOperations = {
  /**
   * Get the vault record
   * @returns {Promise<Object|null>} The vault object or null if not found
   */
  get: async () => {
    // Open vault store in read-only mode
    const store = await getStore(STORES.VAULT, 'readonly')
    return new Promise((resolve, reject) => {
      // Request the record with id 'main' (only one vault exists)
      const request = store.get('main')
      // On success: return the vault or null if not found
      request.onsuccess = () => resolve(request.result || null)
      // On error: reject the promise
      request.onerror = () => reject(new Error('Failed to get vault'))
    })
  },

  /**
   * Set the vault record (create or update)
   * @param {Object} vaultData - Encrypted vault data (encryptedData, salt, etc.)
   * @returns {Promise<void>}
   */
  set: async (vaultData) => {
    // Open vault store in read-write mode
    const store = await getStore(STORES.VAULT, 'readwrite')
    return new Promise((resolve, reject) => {
      // put() creates if doesn't exist, updates if exists
      // Merge the fixed id 'main' with the provided vault data
      const request = store.put({ id: 'main', ...vaultData })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to set vault'))
    })
  },

  /**
   * Clear the vault (delete all vault data)
   * @returns {Promise<void>}
   */
  clear: async () => {
    const store = await getStore(STORES.VAULT, 'readwrite')
    return new Promise((resolve, reject) => {
      // Remove all records from vault store
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear vault'))
    })
  }
}

// ============================================
// CACHE OPERATIONS (Multiple records)
// The cache store holds local copies of passwords for quick access
// Has an index on 'folderId' for fast folder-based queries
// ============================================

export const cacheOperations = {
  /**
   * Add or update a cache item
   * @param {Object} item - Cache item (must have 'id' field)
   * @returns {Promise<void>}
   */
  add: async (item) => {
    const store = await getStore(STORES.CACHE, 'readwrite')
    return new Promise((resolve, reject) => {
      // put() will create if new, update if exists
      const request = store.put(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to add cache item'))
    })
  },

  /**
   * Get a cache item by id
   * @param {string|number} id - Item id
   * @returns {Promise<Object|null>} The cache item or null if not found
   */
  get: async (id) => {
    const store = await getStore(STORES.CACHE, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error('Failed to get cache item'))
    })
  },

  /**
   * Get all cache items
   * @returns {Promise<Array>} Array of all cached passwords
   */
  getAll: async () => {
    const store = await getStore(STORES.CACHE, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get all cache items'))
    })
  },

  /**
   * Get cache items by folderId using the index
   * This is FAST because we created an index on 'folderId'
   * @param {string|number} folderId - Folder id to filter by
   * @returns {Promise<Array>} Array of passwords in the specified folder
   */
  getByFolder: async (folderId) => {
    const store = await getStore(STORES.CACHE, 'readonly')
    // Use the index instead of scanning all records
    const index = store.index('folderId')
    return new Promise((resolve, reject) => {
      // Get all records where folderId matches
      const request = index.getAll(folderId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get cache items by folder'))
    })
  },

  /**
   * Delete a cache item by id
   * @param {string|number} id - Item id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const store = await getStore(STORES.CACHE, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete cache item'))
    })
  },

  /**
   * Clear all cache (remove all cached passwords)
   * @returns {Promise<void>}
   */
  clear: async () => {
    const store = await getStore(STORES.CACHE, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear cache'))
    })
  }
}

// ============================================
// FOLDERS OPERATIONS (Multiple records)
// Folders organize passwords into categories (Work, Personal, etc.)
// ============================================

export const folderOperations = {
  /**
   * Add a folder
   * @param {Object} folder - Folder data
   * @returns {Promise<void>}
   */
  add: async (folder) => {
    const store = await getStore(STORES.FOLDERS, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(folder)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to add folder'))
    })
  },

  /**
   * Get a folder by id
   * @param {string|number} id - Folder id
   * @returns {Promise<Object|null>}
   */
  get: async (id) => {
    const store = await getStore(STORES.FOLDERS, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error('Failed to get folder'))
    })
  },

  /**
   * Get all folders
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    const store = await getStore(STORES.FOLDERS, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get all folders'))
    })
  },

  /**
   * Delete a folder
   * @param {string|number} id - Folder id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const store = await getStore(STORES.FOLDERS, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete folder'))
    })
  },

  /**
   * Clear all folders
   * @returns {Promise<void>}
   */
  clear: async () => {
    const store = await getStore(STORES.FOLDERS, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear folders'))
    })
  }
}

// ============================================
// SETTINGS OPERATIONS (Key-Value store)
// User preferences: theme, language, autoLock, etc.
// Stored as { key: 'settingName', value: settingValue }
// ============================================

export const settingsOperations = {
  /**
   * Get a setting value by key
   * @param {string} key - Setting key (e.g., 'theme', 'language')
   * @returns {Promise<any>} The setting value or null if not found
   */
  get: async (key) => {
    const store = await getStore(STORES.SETTINGS, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      // Extract only the value, not the whole { key, value } object
      request.onsuccess = () => resolve(request.result ? request.result.value : null)
      request.onerror = () => reject(new Error('Failed to get setting'))
    })
  },

  /**
   * Set a setting (create or update)
   * @param {string} key - Setting key (e.g., 'theme')
   * @param {any} value - Setting value (e.g., 'dark')
   * @returns {Promise<void>}
   */
  set: async (key, value) => {
    const store = await getStore(STORES.SETTINGS, 'readwrite')
    return new Promise((resolve, reject) => {
      // Store as { key: 'theme', value: 'dark' }
      const request = store.put({ key, value })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to set setting'))
    })
  },

  /**
   * Get all settings as an object
   * @returns {Promise<Object>} Object with all settings { theme: 'dark', language: 'fr', ... }
   */
  getAll: async () => {
    const store = await getStore(STORES.SETTINGS, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        // Convert array of { key, value } to object { key: value }
        const settings = {}
        request.result.forEach(item => {
          settings[item.key] = item.value
        })
        resolve(settings)
      }
      request.onerror = () => reject(new Error('Failed to get all settings'))
    })
  },

  /**
   * Delete a setting
   * @param {string} key - Setting key
   * @returns {Promise<void>}
   */
  delete: async (key) => {
    const store = await getStore(STORES.SETTINGS, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete setting'))
    })
  },

  /**
   * Clear all settings
   * @returns {Promise<void>}
   */
  clear: async () => {
    const store = await getStore(STORES.SETTINGS, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear settings'))
    })
  }
}

// ============================================
// SESSION OPERATIONS (Key-Value store)
// Temporary data: JWT token, isUnlocked status, lastSync time, etc.
// Stored as { key: 'sessionKey', value: sessionValue }
// ============================================

export const sessionOperations = {
  /**
   * Get a session value by key
   * @param {string} key - Session key (e.g., 'token', 'isUnlocked')
   * @returns {Promise<any>} The session value or null if not found
   */
  get: async (key) => {
    const store = await getStore(STORES.SESSION, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      // Extract only the value, not the whole { key, value } object
      request.onsuccess = () => resolve(request.result ? request.result.value : null)
      request.onerror = () => reject(new Error('Failed to get session value'))
    })
  },

  /**
   * Set a session value (create or update)
   * @param {string} key - Session key (e.g., 'isUnlocked')
   * @param {any} value - Session value (e.g., true)
   * @returns {Promise<void>}
   */
  set: async (key, value) => {
    const store = await getStore(STORES.SESSION, 'readwrite')
    return new Promise((resolve, reject) => {
      // Store as { key: 'isUnlocked', value: true }
      const request = store.put({ key, value })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to set session value'))
    })
  },

  /**
   * Get all session data as an object
   * @returns {Promise<Object>} Object with all session data { token: 'xyz', isUnlocked: true, ... }
   */
  getAll: async () => {
    const store = await getStore(STORES.SESSION, 'readonly')
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        // Convert array of { key, value } to object { key: value }
        const session = {}
        request.result.forEach(item => {
          session[item.key] = item.value
        })
        resolve(session)
      }
      request.onerror = () => reject(new Error('Failed to get all session data'))
    })
  },

  /**
   * Delete a session value
   * @param {string} key - Session key
   * @returns {Promise<void>}
   */
  delete: async (key) => {
    const store = await getStore(STORES.SESSION, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete session value'))
    })
  },

  /**
   * Clear all session data
   * @returns {Promise<void>}
   */
  clear: async () => {
    const store = await getStore(STORES.SESSION, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear session'))
    })
  }
}

export default {
  initDB,
  vaultOperations,
  cacheOperations,
  folderOperations,
  settingsOperations,
  sessionOperations,
  STORES
}
