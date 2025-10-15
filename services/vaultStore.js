import { create } from 'zustand'
import {
  generateSalt,
  generateIV,
  deriveKey,
  encryptData,
  decryptData
} from './cryptoService.js'
import { vaultOperations } from './indexedDB.js'

const useVaultStore = create((set, get) => ({
  // State
  isLocked: true,
  passwords: [],
  masterKey: null, // CryptoKey object stored in RAM while unlocked
  salt: null, // 32-byte salt for PBKDF2 key derivation
  iv: null, // 12-byte IV for AES-GCM encryption (changes on each save)

  // Internal helper: Save vault to IndexedDB (encrypted)
  saveVault: async () => {
    const { passwords, masterKey, salt } = get()

    // Create vault structure
    const vaultData = {
      passwords,
      version: '1.0',
      updatedAt: new Date().toISOString()
    }

    // Serialize to JSON
    const vaultJSON = JSON.stringify(vaultData)

    // Encrypt vault with AES-256-GCM (generates new IV internally)
    const { encrypted, iv: newIV } = await encryptData(vaultJSON, masterKey)

    // Prepare encrypted vault payload
    const encryptedVaultData = {
      encrypted_vault: encrypted,
      iv: newIV,
      salt: salt,
      version: '1.0',
      updatedAt: new Date().toISOString()
    }

    // Save encrypted vault to IndexedDB
    await vaultOperations.set(encryptedVaultData)

    // Update IV in state (for next encryption)
    set({ iv: newIV })
  },

  // Actions
  /**
   * Unlock the vault by decrypting it with the master password.
   *
   * For first-time users, creates a new encrypted vault.
   * For existing users, decrypts the vault from IndexedDB.
   *
   * @param {string} masterPassword - User's master password
   * @returns {Promise<{success: boolean, message?: string, error?: string}>} Result object
   */
  unlock: async (masterPassword) => {
    try {
      // Get vault from IndexedDB
      const storedVault = await vaultOperations.get()

      // Handle first-time unlock (no vault exists yet)
      if (!storedVault) {
        // Generate new salt for this user
        const newSalt = generateSalt()

        // Create empty vault
        const emptyVault = {
          passwords: [],
          version: '1.0',
          createdAt: new Date().toISOString()
        }

        // Derive key from master password
        const key = await deriveKey(masterPassword, newSalt)

        // Serialize vault to JSON
        const vaultJSON = JSON.stringify(emptyVault)

        // Encrypt with new IV
        const { encrypted, iv } = await encryptData(vaultJSON, key)

        // Save to IndexedDB
        await vaultOperations.set({
          encrypted_vault: encrypted,
          iv: iv,
          salt: newSalt,
          version: '1.0',
          updatedAt: new Date().toISOString()
        })

        // Set state for unlocked empty vault
        set({
          isLocked: false,
          passwords: [],
          masterKey: key,
          salt: newSalt,
          iv: iv
        })

        return { success: true, message: 'Vault created and unlocked' }
      }

      // Decrypt existing vault
      // Derive key from master password and stored salt
      const key = await deriveKey(masterPassword, storedVault.salt)

      // Decrypt vault using stored IV
      const decryptedJSON = await decryptData(
        storedVault.encrypted_vault,
        key,
        storedVault.iv
      )

      // Parse decrypted JSON
      const vaultData = JSON.parse(decryptedJSON)

      // Load passwords into RAM
      set({
        isLocked: false,
        passwords: vaultData.passwords || [],
        masterKey: key,
        salt: storedVault.salt,
        iv: storedVault.iv
      })

      return { success: true, message: 'Vault unlocked successfully' }
    } catch (error) {
      console.error('Unlock failed:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Lock the vault by clearing all sensitive data from RAM.
   */
  lock: () => {
    set({
      isLocked: true,
      passwords: [],
      masterKey: null,
      salt: null,
      iv: null
    })
  },

  /**
   * Add a new password to the vault.
   */
  addPassword: async (passwordData) => {
    const { passwords, saveVault } = get()

    const newPassword = {
      id: Date.now(),
      ...passwordData,
      created_at: new Date().toISOString()
    }

    set({
      passwords: [...passwords, newPassword]
    })

    await saveVault()

    return { success: true, password: newPassword }
  },

  /**
   * Update an existing password in the vault.
   */
  updatePassword: async (id, updatedData) => {
    const { passwords, saveVault } = get()

    const updatedPasswords = passwords.map(pwd =>
      pwd.id === id ? { ...pwd, ...updatedData } : pwd
    )

    set({ passwords: updatedPasswords })

    await saveVault()

    return { success: true }
  },

  /**
   * Delete a password from the vault.
   */
  deletePassword: async (id) => {
    const { passwords, saveVault } = get()

    const filteredPasswords = passwords.filter(pwd => pwd.id !== id)

    set({ passwords: filteredPasswords })

    await saveVault()

    return { success: true }
  },

  /**
   * Search passwords by name, domain, or username.
   */
  searchPasswords: (query) => {
    const { passwords } = get()

    if (!query) return passwords

    const lowerQuery = query.toLowerCase()
    return passwords.filter(pwd =>
      pwd.name.toLowerCase().includes(lowerQuery) ||
      pwd.domain.toLowerCase().includes(lowerQuery) ||
      pwd.username.toLowerCase().includes(lowerQuery)
    )
  }
}))

export default useVaultStore
