import { useState } from 'react'

function PasswordItem({ password, onCopyUsername, onCopyPassword, copiedId, onEdit, onDelete }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="password-item">
      <div className="password-item-header">
        <div className="password-icon">{password.name?.[0] || '?'}</div>
        <div className="password-info">
          <div className="password-name">{password.name || 'Untitled'}</div>
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
            <span
              className="password-value clickable"
              onClick={onCopyPassword}
              title="Click to copy password"
              style={{ cursor: 'pointer' }}
            >
              {copiedId === `${password.id}-pass` ? 'Copied!' : (showPassword ? password.password : '••••••••')}
            </span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--medium-red)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '2px 6px',
                marginLeft: '4px'
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {password.notes && (
            <div className="password-field">
              <span
                className="password-label clickable"
                onClick={() => setShowNotes(!showNotes)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                Notes: {showNotes ? '▼' : '▶'}
              </span>
              {showNotes && (
                <div className="password-notes" style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                  {password.notes}
                </div>
              )}
            </div>
          )}
          {password.created_at && (
            <div className="password-timestamp" style={{ fontSize: '0.7rem', color: '#999', marginTop: '8px' }}>
              Created: {new Date(password.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      <div className="password-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onEdit(password)}
          style={{
            background: 'transparent',
            border: '1px solid var(--medium-red)',
            color: 'var(--medium-red)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '4px 12px',
            borderRadius: '4px'
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(password.id)}
          style={{
            background: 'var(--medium-red)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '4px 12px',
            borderRadius: '4px'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default PasswordItem;
