import PasswordItem from './PasswordItem';

function PasswordList({ passwords, copiedId, onCopyUsername, onCopyPassword }) {
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
      {passwords.map(pwd => (
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
