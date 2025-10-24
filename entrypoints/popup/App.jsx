import { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import LinkAccountView from './components/LinkAccountView';
import MasterPasswordExplainerView from './components/MasterPasswordExplainerView';
import SetupMasterPasswordView from './components/SetupMasterPasswordView';
import Header from './components/Header';
import BurgerMenu from './components/BurgerMenu';
import SearchBar from './components/SearchBar';
import PasswordListCompact from './components/PasswordListCompact';
import PasswordDetails from './components/PasswordDetails';
import AddPasswordForm from './components/AddPasswordForm';
import EditPasswordForm from './components/EditPasswordForm';
import ChangeMasterPasswordView from './components/ChangeMasterPasswordView';
import useVaultStore from '../../services/vaultStore';
import { useBackgroundMessage } from './hooks/useBackgroundMessage';
import './style.css';

/**
 * App Component - Main Extension Entry Point
 *
 * Zero-Knowledge Onboarding Flow:
 * 1. LinkAccountView - User pastes JWT token from web app
 * 2. MasterPasswordExplainerView - Educational carousel about Zero-Knowledge
 * 3. SetupMasterPasswordView - Create Master Password + Recovery Key
 * 4. LoginView - Unlock vault with Master Password (when locked)
 * 5. Main App - Password management interface
 */
function App() {
  const { isLocked, passwords, deletePassword, addPassword, updatePassword, lock } = useVaultStore();
  const { lockVault: lockBackground } = useBackgroundMessage();

  // Onboarding state
  const [hasToken, setHasToken] = useState(null);
  const [hasSeenExplainer, setHasSeenExplainer] = useState(null);
  const [hasMasterPassword, setHasMasterPassword] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [activeVaultId, setActiveVaultId] = useState('personal');
  const [selectedPassword, setSelectedPassword] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Mock vaults - in real app, these would come from store
  const vaults = [
    { id: 'personal', name: 'Personal', color: '#af0024', icon: '🔐' },
    { id: 'work', name: 'Work', color: '#470508', icon: '💼' },
    { id: 'shared', name: 'Shared', color: '#77080e', icon: '👥' }
  ];

  const handleLogout = async () => {
    // Lock both popup store AND background store
    await Promise.all([
      lock(),
      lockBackground()
    ]);
  };

  // Filter by vault - for now show all since passwords don't have vault_id yet
  let vaultFilteredPasswords = passwords;
  // TODO: Filter by vault when vault system is fully implemented
  // vaultFilteredPasswords = passwords.filter(pwd => pwd.vault_id === activeVaultId);

  // Filter by search query
  const filteredPasswords = vaultFilteredPasswords.filter(pwd =>
    pwd.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pwd.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pwd.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned items first, then by date
  const sortedPasswords = [...filteredPasswords].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  /**
   * Check onboarding status on mount
   * Determines which screen to show in the onboarding flow
   */
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!chrome?.storage?.local) return;

      chrome.storage.local.get(
        ["token", "hasSeenExplainer", "hasMasterPassword", "masterPasswordHash", "masterPasswordSalt"],
        async ({ token, hasSeenExplainer, hasMasterPassword, masterPasswordHash, masterPasswordSalt }) => {
          // Step 1: Check if token exists (account linked)
          if (!token) {
            setHasToken(false);
            setHasSeenExplainer(true); // Skip explainer if no token
            setHasMasterPassword(false);
            return;
          }

          setHasToken(true);

          // Step 2: Check if user has seen the explainer
          setHasSeenExplainer(!!hasSeenExplainer);

          // Step 3: Check if user has Master Password
          try {
            // Check the API first
            const API_URL = import.meta.env.VITE_API_URL || 'https://passforge-api.onrender.com';
            const res = await fetch(`${API_URL}/api/master_password`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`API check failed: ${res.status}`);
            const data = await res.json();
            const apiHasMasterPassword = !!data.has_master_password;

            if (!apiHasMasterPassword) {
              await chrome.storage.local.remove([
                "hasMasterPassword",
                "masterPasswordHash",
                "masterPasswordSalt",
              ]);
              setHasMasterPassword(false);
              return;
            }

            // If API has a master password, ensure local state matches
            if (apiHasMasterPassword && !hasMasterPassword) {
              await chrome.storage.local.set({ hasMasterPassword: true });
            }

            setHasMasterPassword(true);
          } catch (err) {
            // Offline fallback
            if (masterPasswordHash && masterPasswordSalt) {
              setHasMasterPassword(true);
            } else {
              setHasMasterPassword(false);
            }
          }
        }
      );
    };

    checkOnboardingStatus();
  }, []);

  // Local integrity check
  useEffect(() => {
    const verifyLocalMasterPassword = async () => {
      chrome.storage.local.get(["hasMasterPassword", "masterPasswordHash", "masterPasswordSalt"], (result) => {
        const { hasMasterPassword, masterPasswordHash, masterPasswordSalt } = result;

        if (hasMasterPassword && (!masterPasswordHash || !masterPasswordSalt)) {
          chrome.storage.local.remove(["hasMasterPassword", "masterPasswordHash", "masterPasswordSalt"], () => {
            setHasMasterPassword(false);
          });
        }
      });
    };

    verifyLocalMasterPassword();
  }, []);

  /**
   * Onboarding Flow Render Logic
   * Progressively reveals screens based on completion state
   */

  // Loading state - checking onboarding status
  if (hasToken === null || hasSeenExplainer === null || hasMasterPassword === null) {
    return <div className="loading-screen">Loading...</div>;
  }

  // Step 1: Link Account - User must paste JWT token from web app
  if (!hasToken) {
    return (
      <div className="app">
        <LinkAccountView
          onLinkComplete={() => {
            setHasToken(true);
            setHasSeenExplainer(false); // Show explainer after linking
          }}
        />
      </div>
    );
  }

  // Step 2: Master Password Explainer - Educational carousel about Zero-Knowledge
  if (!hasSeenExplainer) {
    return (
      <div className="app">
        <MasterPasswordExplainerView
          onComplete={() => {
            // Mark explainer as seen
            chrome.storage.local.set({ hasSeenExplainer: true });
            setHasSeenExplainer(true);
          }}
        />
      </div>
    );
  }

  // Step 3: Setup Master Password - Create Master Password + Recovery Key
  if (!hasMasterPassword) {
    return (
      <div className="app">
        <SetupMasterPasswordView
          onSetupComplete={() => setHasMasterPassword(true)}
        />
      </div>
    );
  }

  // Step 4: Login - Unlock vault with Master Password (when vault is locked)
  if (isLocked) {
    return (
      <div className="app">
        <LoginView />
      </div>
    );
  }

  // Step 5: Main App - Password management interface

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  return (
    <div className="app">
      <Header onAdd={() => setShowAddForm(true)} itemCount={passwords.length}>
        <BurgerMenu
          vaults={vaults}
          activeVaultId={activeVaultId}
          onVaultChange={setActiveVaultId}
          onChangeMasterPassword={() => setShowChangePassword(true)}
          onLogout={handleLogout}
        />
      </Header>

      <div className="app-main-two-pane">
        <div className="middle-pane">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <PasswordListCompact
            passwords={sortedPasswords}
            selectedId={selectedPassword?.id}
            onSelect={setSelectedPassword}
          />
        </div>

        <PasswordDetails
          password={selectedPassword}
          onClose={() => setSelectedPassword(null)}
          copiedId={copiedId}
          onCopyUsername={copyToClipboard}
          onCopyPassword={copyToClipboard}
          onEdit={(password) => {
            setEditingPassword(password);
            setShowEditForm(true);
          }}
          onDelete={(id) => {
            deletePassword(id);
            setSelectedPassword(null);
          }}
        />

        {showAddForm && (
          <AddPasswordForm
            onClose={() => setShowAddForm(false)}
            onSubmit={(data) => {
              addPassword(data);
              setShowAddForm(false);
            }}
          />
        )}

        {showEditForm && editingPassword && (
          <EditPasswordForm
            password={editingPassword}
            onClose={() => {
              setShowEditForm(false);
              setEditingPassword(null);
            }}
            onSubmit={(data) => {
              updatePassword(editingPassword.id, data);
              setShowEditForm(false);
              setEditingPassword(null);
            }}
          />
        )}

        {showChangePassword && (
          <ChangeMasterPasswordView
            onCancel={() => setShowChangePassword(false)}
            onComplete={() => {
              setShowChangePassword(false);
              alert("Master password successfully updated");
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
