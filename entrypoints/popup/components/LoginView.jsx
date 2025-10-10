import { useState } from 'react';

function LoginView({ onUnlock }) {
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Temporary: Accept any non-empty password
    if (masterPassword.trim()) {
      onUnlock();
      setError('');
    } else {
      setError('Please enter your master password');
    }
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

        <button type="submit" className="btn-unlock">
          Unlock
        </button>
      </form>
    </div>
  );
}

export default LoginView;
