 import { useState, useEffect } from 'react';
import { HiMenu, HiX, HiPlus, HiTrash, HiLogout, HiCog, HiLockClosed, HiUser, HiBriefcase, HiUsers, HiFolder, HiArrowRight, HiShieldCheck } from 'react-icons/hi';

function BurgerMenu({ vaults = [], activeVaultId, onVaultChange, onLogout, onChangeMasterPassword, onLock }) {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Get user email from storage
  useEffect(() => {
    chrome.storage.local.get(['userEmail'], ({ userEmail }) => {
      setUserEmail(userEmail || 'Not linked');
    });
  }, []);

  const displayVaults = vaults.length === 0 ? [
    { id: 'personal', name: 'Personal', color: '#af0024', iconType: 'personal' }
  ] : vaults;

  // Get icon component based on type
  const getVaultIcon = (iconType) => {
    switch (iconType) {
      case 'personal': return <HiUser />;
      case 'work': return <HiBriefcase />;
      case 'shared': return <HiUsers />;
      default: return <HiFolder />;
    }
  };

  const handleLock = async () => {
    if (onLock) {
      await onLock();
    }
    setIsOpen(false);
  };

  const handleSwitchAccount = async () => {
    const confirmed = confirm(
      'Switch Account\n\nThis will:\n• Clear your current session\n• Keep your encrypted vault data\n• Allow linking a different account\n\nContinue?'
    );

    if (confirmed) {
      // Clear session data but keep vault
      await chrome.storage.local.remove([
        'token',
        'hasMasterPassword',
        'hasSeenExplainer',
        'userEmail'
      ]);
      window.location.reload();
    }
  };

  const handleFullLogout = async () => {
    const confirmed = confirm(
      '🚨 DANGER: Logout & Clear Everything\n\nThis will PERMANENTLY DELETE:\n• All your saved passwords\n• Vault data\n• Account linking\n\nConsider exporting your data first.\n\nAre you ABSOLUTELY sure?'
    );

    if (confirmed) {
      await chrome.storage.local.clear();
      window.location.reload();
    }
  };

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
            {/* Account Info Header - Fixed at top */}
            <div className="burger-account-header">
              <div className="account-info">
                <HiShieldCheck className="account-icon" />
                <div className="account-details">
                  <span className="account-label">Account</span>
                  <span className="account-email">{userEmail}</span>
                </div>
              </div>
            </div>

            <div className="burger-separator"></div>

            {/* Scrollable Content */}
            <div className="burger-menu-content">

            {/* Quick Actions */}
            <div className="burger-section">
              <h4 className="section-title">Quick Actions</h4>

              <button
                className="burger-menu-item"
                onClick={handleLock}
                title="Lock Vault"
              >
                <HiLockClosed className="menu-item-icon" />
                <span>Lock Vault</span>
              </button>

              <button
                className="burger-menu-item"
                onClick={handleSwitchAccount}
                title="Switch Account"
              >
                <HiArrowRight className="menu-item-icon" />
                <span>Switch Account</span>
              </button>
             </div>

             {/* Settings Section */}
            <div className="burger-section">
              <h4 className="section-title">Settings</h4>

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
                className="burger-menu-item"
                onClick={() => {
                  console.log('Trash - feature coming soon');
                  setIsOpen(false);
                }}
                title="Trash"
              >
                <HiTrash className="menu-item-icon" />
                <span>Trash</span>
              </button>
            </div>

            <div className="burger-separator"></div>

            {/* Destructive Actions */}
            <div className="burger-section">
              <button
                className="burger-menu-item logout destructive"
                onClick={handleFullLogout}
                title="Logout & Clear Everything"
              >
                <HiLogout className="menu-item-icon" />
                <span>Logout & Clear Data</span>
              </button>
            </div>
            </div> {/* End burger-menu-content */}
          </div>
        </>
      )}
    </>
  );
}

export default BurgerMenu;
