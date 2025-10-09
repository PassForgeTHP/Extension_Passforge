import { useState } from 'react';
import './style.css';

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();

    // Temporary: Accept any non-empty password
    if (masterPassword.trim()) {
      setIsLocked(false);
      setError('');
    } else {
      setError('Please enter your master password');
    }
  };

  if (isLocked) {
    return (
      <div className="app">
        <div className="login-container">
          <div className="login-header">
            <div className="logo">🔐</div>
            <h1>PassForge</h1>
            <p>Enter your master password to unlock</p>
          </div>

          <form className="login-form" onSubmit={handleUnlock}>
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
      </div>
    );
  }

  return (
    <div className="app">
      <div className="main-container">
        <h2>Password List (Coming soon)</h2>
        <button onClick={() => setIsLocked(true)}>Lock</button>
      </div>
    </div>
  );
}

export default App;
