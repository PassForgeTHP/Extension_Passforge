/**
 * Password Generator Service
 * Generates secure random passwords with customizable options
 */

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

/**
 * Generate a random password based on options
 * @param {Object} options - Generation options
 * @param {number} options.length - Password length (default: 16)
 * @param {boolean} options.lowercase - Include lowercase letters (default: true)
 * @param {boolean} options.uppercase - Include uppercase letters (default: true)
 * @param {boolean} options.numbers - Include numbers (default: true)
 * @param {boolean} options.symbols - Include symbols (default: true)
 * @returns {string} Generated password
 */
export function generatePassword(options = {}) {
  const {
    length = 16,
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = true
  } = options

  // Build character set based on options
  let charset = ''
  if (lowercase) charset += CHAR_SETS.lowercase
  if (uppercase) charset += CHAR_SETS.uppercase
  if (numbers) charset += CHAR_SETS.numbers
  if (symbols) charset += CHAR_SETS.symbols

  // Ensure at least one character set is selected
  if (charset.length === 0) {
    charset = CHAR_SETS.lowercase + CHAR_SETS.uppercase + CHAR_SETS.numbers
  }

  // Generate password using crypto.getRandomValues for security
  const passwordArray = new Uint8Array(length)
  crypto.getRandomValues(passwordArray)

  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset[passwordArray[i] % charset.length]
  }

  return password
}

/**
 * Calculate password strength score
 * @param {string} password - Password to evaluate
 * @returns {Object} Strength result with score and level
 */
export function calculatePasswordStrength(password) {
  if (!password) {
    return { score: 0, level: 'empty', percentage: 0 }
  }

  let score = 0

  // Length bonus
  if (password.length >= 8) score += 20
  if (password.length >= 12) score += 20
  if (password.length >= 16) score += 10

  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 15
  if (/[^a-zA-Z0-9]/.test(password)) score += 10

  // Determine strength level
  let level = 'weak'
  if (score >= 80) level = 'strong'
  else if (score >= 50) level = 'medium'

  return {
    score,
    level,
    percentage: Math.min(100, score)
  }
}
