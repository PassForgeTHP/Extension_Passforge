import { useState } from 'react';
import { HiShieldCheck, HiEye, HiEyeOff, HiLockClosed } from 'react-icons/hi';
import useVaultStore from '../../../services/vaultStore';
import { useBackgroundMessage } from '../hooks/useBackgroundMessage';

function LoginView() {
  const unlock = useVaultStore(state => state.unlock);
  const { unlockVault: unlockBackground } = useBackgroundMessage();

  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!masterPassword.trim()) {
      setError('Please enter your master password');
      return;
    }

    setLoading(true);
    setError('');

    // Unlock both popup store AND background store
    const [popupResult, backgroundResult] = await Promise.all([
      unlock(masterPassword),
      unlockBackground(masterPassword)
    ]);

    if (!popupResult.success || !backgroundResult.success) {
      setError(popupResult.error || backgroundResult.error || 'Invalid master password');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo-large">
          <HiShieldCheck className="logo-icon-large" />
        </div>
        <h1>PassForge</h1>
        <p>Enter your master password to unlock your vault</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Master password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              autoFocus
              className="master-password-input"
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message shake">
            <HiLockClosed className="error-icon" />
            {error}
          </div>
        )}

        <button type="submit" className="btn-unlock" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Unlocking...
            </>
          ) : (
            <>
              <HiLockClosed />
              Unlock Vault
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default LoginView;
