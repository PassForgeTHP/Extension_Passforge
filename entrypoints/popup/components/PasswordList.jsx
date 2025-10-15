import { useState } from 'react';
import PasswordItem from './PasswordItem';

function PasswordList({ passwords, copiedId, onCopyUsername, onCopyPassword }) {
  const [sortOrder, setSortOrder] = useState('newest');

  const sortedPasswords = [...passwords].sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

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
      {sortedPasswords.map(pwd => (
        <PasswordItem
          key={pwd.id}
          password={pwd}
          copiedId={copiedId}
          onCopyUsername={() => onCopyUsername(pwd.username, `${pwd.id}-user`)}
          onCopyPassword={() => onCopyPassword(pwd.password, `${pwd.id}-pass`)}
        />
      ))}
    </div>
  );
}

export default PasswordList;
