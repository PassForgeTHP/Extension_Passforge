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
  HiX
} from 'react-icons/hi';

function PasswordDetails({ password, onClose, onCopyUsername, onCopyPassword, copiedId, onEdit, onDelete }) {
  const [showPassword, setShowPassword] = useState(false);

  if (!password) {
    return (
      <div className="password-details-panel empty">
        <div className="no-selection">
          <HiKey className="no-selection-icon" />
          <p>Select an item to view details</p>
        </div>
      </div>
    );
  }

  const handleCopyUsername = () => {
    onCopyUsername(password.username, `${password.id}-user`);
  };

  const handleCopyPassword = () => {
    onCopyPassword(password.password, `${password.id}-pass`);
  };

  return (
    <div className="password-details-panel">
      <div className="details-header">
        <h2>{password.name || 'Untitled'}</h2>
        <button onClick={onClose} className="close-details-btn" title="Close">
          <HiX />
        </button>
      </div>

      <div className="details-content">
        <div className="detail-section">
          <label className="detail-label">
            <HiUser />
            Username
          </label>
          <div className="detail-value-row">
            <span className="detail-text">{password.username}</span>
            <button
              className="copy-btn-small"
              onClick={handleCopyUsername}
              title="Copy username"
            >
              {copiedId === `${password.id}-user` ? '✓' : <HiClipboardCopy />}
            </button>
          </div>
        </div>

        <div className="detail-section">
          <label className="detail-label">
            <HiKey />
            Password
          </label>
          <div className="detail-value-row">
            <span className="detail-text password-text">
              {showPassword ? password.password : '••••••••••••'}
            </span>
            <button
              className="copy-btn-small"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide' : 'Show'}
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
            <button
              className="copy-btn-small"
              onClick={handleCopyPassword}
              title="Copy password"
            >
              {copiedId === `${password.id}-pass` ? '✓' : <HiClipboardCopy />}
            </button>
          </div>
        </div>

        {password.domain && (
          <div className="detail-section">
            <label className="detail-label">
              <HiGlobe />
              Website
            </label>
            <div className="detail-value-row">
              <span className="detail-text">{password.domain}</span>
            </div>
          </div>
        )}

        {password.notes && (
          <div className="detail-section">
            <label className="detail-label">
              <HiDocumentText />
              Notes
            </label>
            <div className="detail-value-row">
              <p className="detail-notes">{password.notes}</p>
            </div>
          </div>
        )}

        {password.created_at && (
          <div className="detail-section">
            <label className="detail-label">Created</label>
            <div className="detail-value-row">
              <span className="detail-text-small">
                {new Date(password.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="details-footer">
        <button className="details-action-btn edit" onClick={() => onEdit(password)}>
          <HiPencil />
          Edit
        </button>
        <button className="details-action-btn delete" onClick={() => onDelete(password.id)}>
          <HiTrash />
          Delete
        </button>
      </div>
    </div>
  );
}

export default PasswordDetails;
