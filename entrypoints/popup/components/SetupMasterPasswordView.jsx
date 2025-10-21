import { useState } from "react";
import { HiShieldCheck, HiLockClosed } from "react-icons/hi";

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
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/master_password/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ master_password: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to setup master password");

      onSetupComplete();
    } catch (err) {
      setError(err.message);
    } finally {
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
