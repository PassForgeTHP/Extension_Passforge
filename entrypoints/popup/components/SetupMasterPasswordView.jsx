import { useState, useEffect } from "react";
import { HiShieldCheck, HiLockClosed, HiKey, HiClipboard, HiCheckCircle, HiDownload, HiExclamationCircle } from "react-icons/hi";
import useVaultStore from '../../../services/vaultStore'
import { generateSalt, deriveKey, encryptData, hashMasterPassword } from '../../../services/cryptoService.js'
import { generateRecoveryKey, downloadRecoveryKey, formatRecoveryKeyForDisplay } from '../../../services/recoveryKeyService.js'
import './styles/setupMasterPassword.css';

/**
 * SetupMasterPasswordView Component
 *
 * Allows user to create their Master Password for vault encryption.
 * Zero-Knowledge Architecture: Master Password never sent to server.
 *
 * Features:
 * - Password strength indicator (weak/medium/strong)
 * - Generate Recovery Key for password backup
 * - Copy/Download Recovery Key
 * - Require confirmation checkbox before proceeding
 *
 * @param {Function} onSetupComplete - Callback when Master Password is created
 */
function SetupMasterPasswordView({ onSetupComplete }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);

  const { saveVault } = useVaultStore.getState();

  /**
   * Calculate password strength based on length and complexity
   *
   * @param {string} pwd - Password to evaluate
   * @returns {Object} Strength level and label
   */
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return null;

    let score = 0;

    // Length scoring
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;

    // Complexity scoring
    if (/[a-z]/.test(pwd)) score += 1; // lowercase
    if (/[A-Z]/.test(pwd)) score += 1; // uppercase
    if (/[0-9]/.test(pwd)) score += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1; // symbols

    if (score <= 3) return { level: 'weak', label: 'Weak' };
    if (score <= 5) return { level: 'medium', label: 'Medium' };
    return { level: 'strong', label: 'Strong' };
  };

  /**
   * Update password strength indicator when password changes
   */
  useEffect(() => {
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);

    // Generate Recovery Key when password is strong enough
    if (password.length >= 8 && !recoveryKey) {
      const key = generateRecoveryKey();
      setRecoveryKey(key);
    }
  }, [password]);

  /**
   * Copy Recovery Key to clipboard
   */
  const handleCopyRecoveryKey = async () => {
    if (!recoveryKey) return;

    try {
      await navigator.clipboard.writeText(recoveryKey);
      setRecoveryCopied(true);
      setTimeout(() => setRecoveryCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy Recovery Key:', error);
    }
  };

  /**
   * Download Recovery Key as text file
   */
  const handleDownloadRecoveryKey = () => {
    if (!recoveryKey) return;

    chrome.storage.local.get(['userEmail'], ({ userEmail }) => {
      downloadRecoveryKey(recoveryKey, userEmail || 'user');
    });
  };

  /**
   * Create Master Password and initialize vault
   */
  const handleSetup = async (e) => {
    e.preventDefault();

    // Validation: Password must be at least 8 characters
    if (!password.trim() || password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    // Validation: Passwords must match
    if (password !== confirm) {
      return setError("Passwords do not match");
    }

    // Validation: Must confirm Recovery Key saved
    if (!recoveryConfirmed) {
      return setError("Please confirm that you have saved your Recovery Key");
    }

    setError("");
    setLoading(true);

    try {
      chrome.storage.local.get("token", async ({ token }) => {
        if (!token) {
          setError("You must be logged in to set a master password.");
          setLoading(false);
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL || 'https://passforge-api.onrender.com';

        // Send Master Password hash to Rails API for future verification
        // IMPORTANT: This is sent BEFORE local storage to ensure server-side record exists
        const res = await fetch(`${API_URL}/api/master_password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            user: {
              master_password: password,
              recovery_key: recoveryKey // Store Recovery Key server-side (encrypted)
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to setup master password via API");
          setLoading(false);
          return;
        }

        console.log("Master password successfully saved via API");

        // Generate local hash for offline access
        // This allows extension to verify Master Password without API call
        const masterSalt = generateSalt();
        const hash = await hashMasterPassword(password, masterSalt);

        // Store Master Password hash locally
        chrome.storage.local.set(
          {
            hasMasterPassword: true,
            masterPasswordHash: hash,
            masterPasswordSalt: Array.from(masterSalt),
          },
          async () => {
            console.log("Master password hash saved locally");

            try {
              // Initialize empty vault encrypted with Master Password
              const vaultSalt = generateSalt();

              const vaultKey = await deriveKey(password, vaultSalt, true);
              if (!(vaultKey instanceof CryptoKey)) {
                throw new Error("deriveKey did not return a valid CryptoKey");
              }

              const emptyVault = {
                passwords: [],
                version: "1.0",
                createdAt: new Date().toISOString(),
              };
              const vaultJSON = JSON.stringify(emptyVault);
              const { encrypted, iv } = await encryptData(vaultJSON, vaultKey);

              // Store vault in Zustand state
              useVaultStore.setState({
                passwords: [],
                masterKey: vaultKey,
                salt: vaultSalt,
                iv: iv,
                isLocked: false,
              });

              // Save vault to chrome.storage.local
              await saveVault();

              console.log("Vault initialized and saved locally");
              onSetupComplete();
              setLoading(false);
            } catch (err) {
              console.error("Error initializing vault:", err);
              setError("Failed to initialize vault locally");
              setLoading(false);
            }
          }
        );
      });
    } catch (err) {
      console.error("Global setup error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="logo-large">
          <HiShieldCheck className="logo-icon-large" />
        </div>
        <h1>Create Master Password</h1>
        <p>This password will protect your vault with Zero-Knowledge encryption.</p>
      </div>

      <form className="setup-form" onSubmit={handleSetup}>
        {/* Password Input */}
        <div className="form-group">
          <input
            type="password"
            placeholder="Enter master password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="master-password-input"
            disabled={loading}
          />
        </div>

        {/* Password Strength Indicator */}
        {passwordStrength && (
          <div className="password-strength">
            <div className="strength-bar-container">
              <div className={`strength-bar ${passwordStrength.level}`}></div>
            </div>
            <div className={`strength-text ${passwordStrength.level}`}>
              <HiShieldCheck className="strength-icon" />
              <span>Password Strength: {passwordStrength.label}</span>
            </div>
          </div>
        )}

        {/* Confirm Password Input */}
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm master password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="master-password-input"
            disabled={loading}
          />
        </div>

        {/* Recovery Key Section */}
        {recoveryKey && password.length >= 8 && (
          <div className="recovery-key-section">
            <div className="recovery-key-header">
              <HiKey />
              <h3>Your Recovery Key</h3>
            </div>

            <p className="recovery-key-description">
              Save this Recovery Key in a secure location. It can restore access to your vault if you forget your Master Password.
            </p>

            <div className="recovery-key-display">
              {formatRecoveryKeyForDisplay(recoveryKey)}
            </div>

            <div className="recovery-key-actions">
              <button
                type="button"
                onClick={handleCopyRecoveryKey}
                className={`btn-recovery-action btn-copy-recovery ${recoveryCopied ? 'copied' : ''}`}
              >
                {recoveryCopied ? (
                  <>
                    <HiCheckCircle />
                    Copied
                  </>
                ) : (
                  <>
                    <HiClipboard />
                    Copy Key
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadRecoveryKey}
                className="btn-recovery-action btn-download-recovery"
              >
                <HiDownload />
                Download
              </button>
            </div>

            <div className="recovery-confirmation">
              <input
                type="checkbox"
                id="recovery-confirm"
                checked={recoveryConfirmed}
                onChange={(e) => setRecoveryConfirmed(e.target.checked)}
              />
              <label htmlFor="recovery-confirm">
                <strong>I have saved my Recovery Key</strong> in a secure location and understand that it is the only way to recover my vault if I forget my Master Password.
              </label>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <HiExclamationCircle className="error-icon" />
            {error}
          </div>
        )}

        {/* Warning */}
        <div className="warning-box">
          <HiExclamationCircle />
          <p>
            <strong>Warning:</strong> If you lose both your Master Password and Recovery Key, your data cannot be recovered due to Zero-Knowledge encryption.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-unlock btn-create-password"
          disabled={loading || !recoveryConfirmed}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Creating...
            </>
          ) : (
            <>
              <HiLockClosed />
              Create Master Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default SetupMasterPasswordView;
