/**
 * Recovery Key Service
 *
 * Generates and manages Recovery Keys for Master Password backup.
 * Recovery Keys are 128-character strings that can restore access to the vault
 * if the user forgets their Master Password.
 *
 * IMPORTANT: Recovery Keys must be stored securely by the user.
 * They are NOT stored locally or on the server.
 */

/**
 * Generate a cryptographically secure Recovery Key
 *
 * Format: 128 characters (32 groups of 4 characters, separated by dashes)
 * Example: ABCD-EFGH-IJKL-MNOP-...
 *
 * @returns {string} Recovery Key in format XXXX-XXXX-XXXX-... (32 groups)
 */
export function generateRecoveryKey() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const groups = 32; // 32 groups of 4 characters = 128 characters
  const groupLength = 4;

  const recoveryGroups = [];

  for (let i = 0; i < groups; i++) {
    let group = '';
    const randomValues = new Uint8Array(groupLength);
    crypto.getRandomValues(randomValues);

    for (let j = 0; j < groupLength; j++) {
      const randomIndex = randomValues[j] % charset.length;
      group += charset[randomIndex];
    }

    recoveryGroups.push(group);
  }

  return recoveryGroups.join('-');
}

/**
 * Validate Recovery Key format
 *
 * @param {string} recoveryKey - Recovery Key to validate
 * @returns {boolean} True if valid format
 */
export function isValidRecoveryKey(recoveryKey) {
  if (!recoveryKey) return false;

  // Should be 32 groups of 4 alphanumeric characters separated by dashes
  const pattern = /^([A-Z0-9]{4}-){31}[A-Z0-9]{4}$/;
  return pattern.test(recoveryKey);
}

/**
 * Format Recovery Key for display (add line breaks for readability)
 *
 * @param {string} recoveryKey - Recovery Key to format
 * @returns {string} Formatted key with line breaks every 8 groups
 */
export function formatRecoveryKeyForDisplay(recoveryKey) {
  const groups = recoveryKey.split('-');
  const lines = [];

  for (let i = 0; i < groups.length; i += 8) {
    lines.push(groups.slice(i, i + 8).join('-'));
  }

  return lines.join('\n');
}

/**
 * Download Recovery Key as a text file
 *
 * @param {string} recoveryKey - Recovery Key to download
 * @param {string} userEmail - User's email for filename
 */
export function downloadRecoveryKey(recoveryKey, userEmail = 'user') {
  const content = `PassForge Recovery Key
========================

Account: ${userEmail}
Generated: ${new Date().toISOString()}

Recovery Key:
${formatRecoveryKeyForDisplay(recoveryKey)}

========================
IMPORTANT SECURITY INSTRUCTIONS:
========================

1. Store this Recovery Key in a secure location
2. This key can be used to recover your Master Password
3. Anyone with this key can access your vault
4. Do NOT share this key with anyone
5. Do NOT store it digitally unless encrypted
6. Consider printing and storing in a safe

If you lose both your Master Password AND this Recovery Key,
your data cannot be recovered due to Zero-Knowledge encryption.
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `passforge-recovery-key-${userEmail}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
