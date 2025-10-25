import { useState } from 'react';
import {
  HiEye,
  HiEyeOff,
  HiClipboardCopy,
  HiPencil,
  HiTrash,
  HiGlobe,
  HiUser,
  HiKey,
  HiDocumentText,
  HiChevronDown,
  HiChevronRight
} from 'react-icons/hi';

function PasswordItem({ password, onCopyUsername, onCopyPassword, copiedId, onEdit, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const handleCopyUsername = () => {
    onCopyUsername(password.username, `${password.id}-user`);
  };

  const handleCopyPassword = () => {
    onCopyPassword(password.password, `${password.id}-pass`);
  };

  return (
    <div className="password-item">
      <div className="password-item-main">
        <div className="password-avatar">
          {getInitials(password.name)}
        </div>

        <div className="password-content">
          <div className="password-header-row">
            <h3 className="password-title">{password.name || 'Untitled'}</h3>
            <div className="password-quick-actions">
              <button
                className="icon-btn"
                onClick={handleCopyUsername}
                title="Copy username"
              >
                {copiedId === `${password.id}-user` ? (
                  <span className="copied-text">✓</span>
                ) : (
                  <HiUser />
                )}
              </button>
              <button
                className="icon-btn"
                onClick={handleCopyPassword}
                title="Copy password"
              >
                {copiedId === `${password.id}-pass` ? (
                  <span className="copied-text">✓</span>
                ) : (
                  <HiKey />
                )}
              </button>
            </div>
          </div>

          <div className="password-meta">
            {password.domain && (
              <span className="meta-item">
                <HiGlobe className="meta-icon" />
                {password.domain}
              </span>
            )}
            <span className="meta-item">
              <HiUser className="meta-icon" />
              {password.username}
            </span>
          </div>

          {(password.notes || password.created_at) && (
            <button
              className="toggle-details-btn"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <HiChevronDown /> : <HiChevronRight />}
              <span>Details</span>
            </button>
          )}

          {showDetails && (
            <div className="password-details">
              <div className="detail-row">
                <span className="detail-label">
                  <HiKey />
                  Password
                </span>
                <div className="detail-value-wrapper">
                  <span className="detail-value">
                    {showPassword ? password.password : '••••••••••••'}
                  </span>
                  <button
                    className="icon-btn-small"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
              </div>

              {password.notes && (
                <div className="detail-row notes-row">
                  <span className="detail-label">
                    <HiDocumentText />
                    Notes
                  </span>
                  <p className="notes-content">{password.notes}</p>
                </div>
              )}

              {password.created_at && (
                <div className="detail-timestamp">
                  Created {new Date(password.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="password-actions">
        <button
          className="action-btn edit-btn"
          onClick={() => onEdit(password)}
          title="Edit"
        >
          <HiPencil />
        </button>
        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(password.id)}
          title="Delete"
        >
          <HiTrash />
        </button>
      </div>
    </div>
  );
}

export default PasswordItem;
