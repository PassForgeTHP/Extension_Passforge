import { useState } from 'react';
import { HiShieldCheck, HiLockClosed, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import './styles/linkAccount.css';

/**
 * LinkAccountView Component
 *
 * First step in the extension onboarding process.
 * User must paste their JWT token from the web app to link their account.
 *
 * Zero-Knowledge Flow:
 * 1. User copies token from https://passforge.com/extension-link
 * 2. Pastes token here
 * 3. Extension validates token with API GET /member-data
 * 4. Token stored in chrome.storage.local (used for API auth only)
 * 5. Next step: Create Master Password for vault encryption
 *
 * @param {Function} onLinkComplete - Callback when account is successfully linked
 */
function LinkAccountView({ onLinkComplete }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Validate and link account with the provided token
   * Makes API call to verify token validity
   */
  const handleLinkAccount = async (e) => {
    e.preventDefault();

    // Validation: Token must not be empty
    if (!token.trim()) {
      setError('Please paste your authentication token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://passforge-api.onrender.com';

      // Verify token by fetching user data
      const res = await fetch(`${API_URL}/member-data`, {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid or expired token. Please get a new one from the web app.');
        }
        throw new Error('Failed to validate token. Please try again.');
      }

      const data = await res.json();

      // Store token and user info in chrome storage
      await chrome.storage.local.set({
        token: token.trim(),
        userId: data.user?.id,
        userEmail: data.user?.email
      });

      setSuccess(true);

      // Wait for success animation, then proceed
      setTimeout(() => {
        onLinkComplete();
      }, 1500);

    } catch (err) {
      console.error('Link account error:', err);
      setError(err.message || 'Failed to link account. Please check your token.');
      setLoading(false);
    }
  };

  return (
    <div className="link-account-container">
      <div className="link-account-header">
        <div className="logo-large">
          <HiShieldCheck className="logo-icon-large" />
        </div>
        <h1>Link Your Account</h1>
        <p>Connect your PassForge extension to your web account</p>
      </div>

      {success ? (
        <div className="success-screen">
          <HiCheckCircle className="success-icon" />
          <p>Account linked successfully!</p>
          <p className="success-subtext">Setting up your secure vault...</p>
        </div>
      ) : (
        <form className="link-account-form" onSubmit={handleLinkAccount}>
          <div className="form-group">
            <label htmlFor="token">Authentication Token</label>
            <textarea
              id="token"
              placeholder="Paste your token here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={6}
              className="token-textarea"
              disabled={loading}
            />
            <p className="helper-text">
              Get your token from: <strong>passforge.com/extension-link</strong>
            </p>
          </div>

          {error && (
            <div className="error-message">
              <HiXCircle className="error-icon" />
              {error}
            </div>
          )}

          <button type="submit" className="btn-link" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              <>
                <HiLockClosed />
                Link Account
              </>
            )}
          </button>
        </form>
      )}

      <div className="instructions-box">
        <h3>How to get your token:</h3>
        <ol>
          <li>Go to <strong>passforge.com</strong> and login</li>
          <li>Navigate to <strong>Profile → Link Extension</strong></li>
          <li>Copy the token displayed on the page</li>
          <li>Paste it above and click "Link Account"</li>
        </ol>
      </div>
    </div>
  );
}

export default LinkAccountView;
