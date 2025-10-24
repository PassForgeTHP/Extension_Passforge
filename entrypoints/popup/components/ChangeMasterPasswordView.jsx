import { useState } from "react";
import { HiLockClosed, HiRefresh, HiEye, HiEyeOff } from "react-icons/hi";
import { generateSalt, deriveKey, encryptData, decryptData, hashMasterPassword, verifyMasterPassword } from "../../../services/cryptoService";
import { generatePassword, calculatePasswordStrength } from "../../../services/passwordGenerator";
import useVaultStore from "../../../services/vaultStore";

function ChangeMasterPasswordView({ onComplete, onCancel }) {
  const { vault, saveVault } = useVaultStore.getState();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  // Update password strength when new password changes
  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  // Generate a secure password that meets requirements
  const generateSecurePassword = () => {
    const password = generatePassword({
      length: 16,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true
    });
    setNewPassword(password);
    setConfirmPassword(password); // Also set confirm field
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    // Password complexity validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      const { token, masterPasswordHash, masterPasswordSalt } = await chrome.storage.local.get([
        "token",
        "masterPasswordHash",
        "masterPasswordSalt",
      ]);

      if (!token) {
        setError("You must be logged in to update master password");
        setLoading(false);
        return;
      }

      const isValid = await verifyMasterPassword(
        currentPassword,
        masterPasswordHash,
        new Uint8Array(masterPasswordSalt)
      );

      if (!isValid) {
        setError("Invalid current master password");
        setLoading(false);
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'https://passforge-api.onrender.com';

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Race between fetch and timeout
      const res = await Promise.race([
        fetch(`${API_URL}/api/master_password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_master_password: currentPassword,
            user: { master_password: newPassword },
          }),
        }),
        timeoutPromise
      ]);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update master password via API");
        setLoading(false);
        return;
      }

      if (vault && vault.encryptedVault) {
        const { encryptedVault, iv, salt: oldSalt } = vault;

        // Validate vault salt exists and is valid
        if (!oldSalt || !(oldSalt instanceof Uint8Array) || oldSalt.length === 0) {
          setError("Invalid vault data. Cannot re-encrypt vault.");
          setLoading(false);
          return;
        }

        const oldKey = await deriveKey(currentPassword, oldSalt, true);
        const decryptedVault = await decryptData({ encrypted: encryptedVault, iv }, oldKey);

        const newSalt = generateSalt();
        const newKey = await deriveKey(newPassword, newSalt, true);
        const { encrypted, iv: newIv } = await encryptData(decryptedVault, newKey);

        useVaultStore.setState({
          vault: { encryptedVault: encrypted, iv: newIv, salt: newSalt },
          isLocked: false,
        });

        await saveVault();
      }

      const newMasterSalt = generateSalt();
      const newMasterHash = await hashMasterPassword(newPassword, newMasterSalt);

      await chrome.storage.local.set({
        hasMasterPassword: true,
        masterPasswordHash: newMasterHash,
        masterPasswordSalt: Array.from(newMasterSalt),
      });

      setSuccess(true);
      setLoading(false);
      if (onComplete) onComplete();

    } catch (err) {
      if (err.message === 'Request timeout') {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError("Something went wrong while updating password");
      }
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>🔐 Secure Your Vault</h2>
      <p className="form-description">
        Change your master password to keep your vault secure. Your new password must be strong and unique.
      </p>

      <form className="login-form" onSubmit={handleChangePassword}>
        {/* Current Password */}
        <div className="password-input-group">
          <input
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Current master password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            title={showCurrentPassword ? "Hide password" : "Show password"}
          >
            {showCurrentPassword ? <HiEyeOff /> : <HiEye />}
          </button>
        </div>

        {/* New Password */}
        <div className="password-input-group">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New master password (min 8 characters)"
            value={newPassword}
            onChange={(e) => handleNewPasswordChange(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowNewPassword(!showNewPassword)}
            title={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <HiEyeOff /> : <HiEye />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {passwordStrength && newPassword && (
          <div className="password-strength">
            <div className="strength-bar">
              <div
                className={`strength-fill strength-${passwordStrength.level}`}
                style={{ width: `${passwordStrength.percentage}%` }}
              ></div>
            </div>
            <span className="strength-text">
              Strength: {passwordStrength.level.charAt(0).toUpperCase() + passwordStrength.level.slice(1)}
            </span>
          </div>
        )}

        {/* Generate Password Button */}
        <button
          type="button"
          className="generate-password-btn"
          onClick={generateSecurePassword}
          title="Generate a secure password"
        >
          <HiRefresh />
          Generate Secure Password
        </button>

        {/* Confirm Password */}
        <div className="password-input-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            title={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Password changed successfully</div>}

        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default ChangeMasterPasswordView;
