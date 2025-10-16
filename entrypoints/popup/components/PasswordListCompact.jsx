import { HiKey, HiDocumentText } from 'react-icons/hi';

function PasswordListCompact({ passwords, selectedId, onSelect }) {
  if (passwords.length === 0) {
    return (
      <div className="empty-state-compact">
        <HiKey className="empty-icon" />
        <p>No items found</p>
      </div>
    );
  }

  return (
    <div className="password-list-compact">
      {passwords.map((password) => (
        <div
          key={password.id}
          className={`password-item-compact ${selectedId === password.id ? 'selected' : ''}`}
          onClick={() => onSelect(password)}
        >
          <div className="item-icon-compact">
            {password.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="item-content-compact">
            <div className="item-title">{password.name || 'Untitled'}</div>
            <div className="item-subtitle">{password.username}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PasswordListCompact;
