import { useState } from 'react'

function PasswordItem({ password, onCopyUsername, onCopyPassword, copiedId }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="password-item">
      <div className="password-item-header">
        <div className="password-icon">{password.name[0]}</div>
        <div className="password-info">
          <div className="password-name">{password.name}</div>
          {password.domain && (
            <div className="password-field">
              <span className="password-label">Domain:</span>
              <span className="password-value">{password.domain}</span>
            </div>
          )}
          <div
            className="password-field clickable"
            onClick={onCopyUsername}
            title="Click to copy username"
          >
            <span className="password-label">Username:</span>
            <span className="password-value">
              {copiedId === `${password.id}-user` ? 'Copied!' : password.username}
            </span>
          </div>
          <div className="password-field">
            <span className="password-label">Password:</span>
            <span className="password-value">
              {copiedId === `${password.id}-pass` ? 'Copied!' : (showPassword ? password.password : '••••••••')}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--medium-red)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '2px 6px'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={onCopyPassword}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--medium-red)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '2px 6px'
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordItem;
