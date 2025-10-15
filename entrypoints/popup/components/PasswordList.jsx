import { useState } from 'react';
import PasswordItem from './PasswordItem';

function PasswordList({ passwords, copiedId, onCopyUsername, onCopyPassword, onDelete, onEdit, loading }) {
  const [sortOrder, setSortOrder] = useState('newest');

  const sortedPasswords = [...passwords].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleDelete = (id) => {
    const password = passwords.find(p => p.id === id);
    if (window.confirm(`Delete password for "${password?.name}"?`)) {
      onDelete(id);
    }
  };

  const handleEdit = (password) => {
    onEdit(password);
  };

  if (loading) {
    return (
      <div className="password-list">
        <div className="loading-state" style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading passwords...</p>
        </div>
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="password-list">
        <div className="empty-state">
          <p>No passwords found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="password-list">
      <div className="password-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
          {passwords.length} password{passwords.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          style={{
            background: 'transparent',
            border: '1px solid var(--medium-red)',
            color: 'var(--medium-red)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>
      {sortedPasswords.map(pwd => (
        <PasswordItem
          key={pwd.id}
          password={pwd}
          copiedId={copiedId}
          onCopyUsername={() => onCopyUsername(pwd.username, `${pwd.id}-user`)}
          onCopyPassword={() => onCopyPassword(pwd.password, `${pwd.id}-pass`)}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
}

export default PasswordList;
