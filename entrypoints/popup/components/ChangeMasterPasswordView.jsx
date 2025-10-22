import { useState } from "react";
import bcrypt from "bcryptjs";
import { HiLockClosed } from "react-icons/hi";
import { generateSalt, deriveKey, encryptData, decryptData } from "../../../services/cryptoService";
import useVaultStore from "../../../services/vaultStore";

function ChangeMasterPasswordView({ onComplete, onCancel }) {
  const { vault, saveVault } = useVaultStore.getState();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    chrome.storage.local.get(["masterPasswordHash", "token"], async ({ masterPasswordHash, token }) => {
      try {
        const isValid = bcrypt.compareSync(currentPassword, masterPasswordHash);
        if (!isValid) {
          setError("Invalid current master password");
          setLoading(false);
          return;
        }

        if (token) {
          const res = await fetch("http://localhost:3000/api/master_password", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              current_master_password: currentPassword,
              user: { master_password: newPassword },
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Failed to update master password via API");
            setLoading(false);
            return;
          }

          console.log("Master password updated via API");
        } else {
          console.warn("Offline mode: API update skipped");
        }

        const oldVault = vault || useVaultStore.getState().vault;

        if (!oldVault || !oldVault.iv || !oldVault.encryptedVault) {
          console.warn("No vault data found locally — skipping re-encryption");
        } else {
          const { salt, iv, encryptedVault } = oldVault;

          const oldKey = await deriveKey(currentPassword, salt, true);
          const decryptedVault = await decryptData({ encrypted: encryptedVault, iv }, oldKey);

          const newSalt = generateSalt();
          const newKey = await deriveKey(newPassword, newSalt, true);
          const { encrypted: newEncryptedVault, iv: newIv } = await encryptData(decryptedVault, newKey);

          useVaultStore.setState({
            masterKey: newKey,
            salt: newSalt,
            iv: newIv,
            vault: { encryptedVault: newEncryptedVault, salt: newSalt, iv: newIv },
          });

          await saveVault();
          console.log("Vault re-encrypted locally with new master password");
        }


        const newSaltForHash = bcrypt.genSaltSync(10);
        const newHash = bcrypt.hashSync(newPassword, newSaltForHash);

        chrome.storage.local.set({
          hasMasterPassword: true,
          masterPasswordHash: newHash,
        });

        setSuccess(true);
        setLoading(false);
        if (onComplete) onComplete();
      } catch (err) {
        console.error("Error updating master password:", err);
        setError("Something went wrong while updating password");
        setLoading(false);
      }
    });
  };

  return (
    <div className="change-master-container">
      <h2>Change Master Password</h2>
      <form className="login-form" onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

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
