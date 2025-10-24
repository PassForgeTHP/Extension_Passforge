import { useState } from 'react';
import { HiMenu, HiX, HiPlus, HiTrash, HiLogout, HiCog, HiFolder, HiLockClosed } from 'react-icons/hi';

function BurgerMenu({ vaults = [], activeVaultId, onVaultChange, onLogout, onChangeMasterPassword }) {
  const [isOpen, setIsOpen] = useState(false);

  const displayVaults = vaults.length === 0 ? [
    { id: 'personal', name: 'Personal', color: '#af0024', icon: '🔐' }
  ] : vaults;

  return (
    <>
      <button
        className="burger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Menu"
      >
        {isOpen ? <HiX /> : <HiMenu />}
      </button>

      {isOpen && (
        <>
          <div className="burger-overlay" onClick={() => setIsOpen(false)} />
          <div className="burger-menu">
            <div className="burger-header">
              <h3>Vaults</h3>
              <button
                className="vault-add-btn-menu"
                onClick={() => {
                  console.log('Create vault - feature coming soon');
                  setIsOpen(false);
                }}
                title="Create vault"
              >
                <HiPlus />
                <span>New Vault</span>
              </button>
            </div>

            <nav className="burger-vaults-list">
              {displayVaults.map((vault) => (
                <button
                  key={vault.id}
                  className={`burger-vault-item ${activeVaultId === vault.id ? 'active' : ''}`}
                  onClick={() => {
                    onVaultChange(vault.id);
                    setIsOpen(false);
                  }}
                >
                  <div
                    className="burger-vault-icon"
                    style={{ backgroundColor: vault.color || '#af0024' }}
                  >
                    <span className="vault-emoji">{vault.icon || '📁'}</span>
                  </div>
                  <span className="burger-vault-name">{vault.name}</span>
                </button>
              ))}
            </nav>

            <div className="burger-footer">
              <button
                className="burger-trash-btn"
                onClick={() => {
                  console.log('Trash - feature coming soon');
                  setIsOpen(false);
                }}
                title="Trash"
              >
                <div className="burger-trash-icon">
                  <HiTrash />
                </div>
                <span>Trash</span>
              </button>
            </div>

            <div className="burger-separator"></div>

            <div className="burger-section">
              {/* <button
                className="burger-menu-item"
                onClick={() => {
                  console.log('Password management - feature coming soon');
                  setIsOpen(false);
                }}
                title="Password Management"
              >
                <HiFolder className="menu-item-icon" />
                <span>Password Management</span>
              </button> */}

              <button
                className="burger-menu-item"
                onClick={() => {
                  window.open('pass-forge-en.netlify.app/', '_blank');
                  setIsOpen(false);
                }}
                title="Settings"
              >
                <HiCog className="menu-item-icon" />
                <span>Settings</span>
              </button>

              <button
                className="burger-menu-item"
                onClick={() => {
                  onChangeMasterPassword();
                  setIsOpen(false);
                }}
                title="Change Master Password"
              >
                <HiLockClosed className="menu-item-icon" />
                <span>Change Master Password</span>
              </button>


              <button
                className="burger-menu-item logout"
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                title="Logout"
              >
                <HiLogout className="menu-item-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default BurgerMenu;
