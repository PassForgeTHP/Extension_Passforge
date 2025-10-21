import { useState } from "react";
import { HiShieldCheck, HiLockClosed } from "react-icons/hi";
import bcrypt from 'bcryptjs';

function SetupMasterPasswordView({ onSetupComplete }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

        // local hash for offline acess
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        chrome.storage.local.set({
          hasMasterPassword: true,
          masterPasswordHash: hash
        }, () => {
          console.log("Master password hash saved locally");
          onSetupComplete();
          setLoading(false);
        });
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };



  return (
    <div>
      <div>
        <h1>Set up your Master Password</h1>
        <p>This password will protect your vault in the extension.</p>
      </div>

      <form className="login-form" onSubmit={handleSetup}>
        <input
          type="password"
          placeholder="Enter master password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm master password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

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
