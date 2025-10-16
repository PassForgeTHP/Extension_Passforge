import {
  HiPlus,
  HiTrash
} from 'react-icons/hi';

function Sidebar({ vaults = [], activeVaultId, onVaultChange }) {
  // Default vault if none exist
  const displayVaults = vaults.length === 0 ? [
    { id: 'personal', name: 'Personal', color: '#af0024', icon: '🔐' }
  ] : vaults;

  return (
    <div className="sidebar-vaults">
      <div className="sidebar-header">
        <button
          className="vault-add-btn"
          title="Create vault"
        >
          <HiPlus />
        </button>
      </div>

      <nav className="vaults-nav">
        {displayVaults.map((vault) => (
          <button
            key={vault.id}
            className={`vault-item ${activeVaultId === vault.id ? 'active' : ''}`}
            onClick={() => onVaultChange(vault.id)}
            title={vault.name}
          >
            <div
              className="vault-icon-wrapper"
              style={{ backgroundColor: vault.color || '#af0024' }}
            >
              <span className="vault-emoji">{vault.icon || '📁'}</span>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="vault-item trash"
          title="Trash"
        >
          <div className="vault-icon-wrapper trash-icon">
            <HiTrash />
          </div>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
