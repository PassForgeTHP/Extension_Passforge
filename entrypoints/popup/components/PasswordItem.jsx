import { useState } from 'react'

function PasswordItem({ password, onCopyUsername, onCopyPassword, copiedId }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="password-item">
      <div className="password-item-header">
        <div className="password-icon">{password.name[0]}</div>
        <div className="password-info">
          <div className="password-name">{password.name}</div>
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
          <div
            className="password-field clickable"
            onClick={onCopyPassword}
            title="Click to copy password"
          >
            <span className="password-label">Password:</span>
            <span className="password-value">
              {copiedId === `${password.id}-pass` ? 'Copied!' : '••••••••'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordItem;
