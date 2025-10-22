import { useState } from "react";
import { HiShieldCheck, HiLockClosed } from "react-icons/hi";
import useVaultStore from '../../../services/vaultStore'
import { generateSalt, deriveKey, encryptData, hashMasterPassword } from '../../../services/cryptoService.js'

function SetupMasterPasswordView({ onSetupComplete }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { saveVault } = useVaultStore.getState();

  const handleSetup = async (e) => {
    e.preventDefault();

    if (!password.trim() || password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    if (password !== confirm) {
      return setError("Passwords do not match");
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

        const res = await fetch("http://localhost:3000/api/master_password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            user: { master_password: password },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to setup master password via API");
          setLoading(false);
          return;
        }

        console.log("Master password successfully saved via API");

        // local hash for offline access
        const masterSalt = generateSalt();
        const hash = await hashMasterPassword(password, masterSalt);

        chrome.storage.local.set(
          {
            hasMasterPassword: true,
            masterPasswordHash: hash,
            masterPasswordSalt: Array.from(masterSalt),
          },
          async () => {
            console.log("Master password hash saved locally");

             try {
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

              useVaultStore.setState({
                passwords: [],
                masterKey: vaultKey,
                salt: vaultSalt,
                iv: iv,
                isLocked: false,
              });

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
    <div className="login-container">
      <div className="login-header">
        <div className="logo-large">
          <HiShieldCheck className="logo-icon-large" />
        </div>
        <h1>Set up your Master Password</h1>
        <p>This password will protect your vault in the extension.</p>
      </div>

      <form className="login-form" onSubmit={handleSetup}>
        <div className="form-group">
          <input
            type="password"
            placeholder="Enter master password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="master-password-input"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm master password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="master-password-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-unlock" disabled={loading}>
          {loading ? "Setting up..." : (
            <>
              <HiLockClosed /> Save Master Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default SetupMasterPasswordView;
