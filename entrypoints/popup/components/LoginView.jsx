import { useState } from 'react';
import useVaultStore from '../../../services/vaultStore';

function LoginView() {
  const unlock = useVaultStore(state => state.unlock);

  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!masterPassword.trim()) {
      setError('Please enter your master password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await unlock(masterPassword);

    if (!result.success) {
      setError(result.error || 'Invalid master password');
      setLoading(false);
    }
    // If success, isLocked becomes false automatically
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo">PF</div>
        <h1>PassForge</h1>
        <p>Enter your master password to unlock</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="password"
            placeholder="Master password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            autoFocus
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-unlock" disabled={loading}>
          {loading ? 'Unlocking...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}

export default LoginView;
