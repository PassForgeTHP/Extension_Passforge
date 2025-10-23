import { useState } from 'react';
import LoginView from './components/LoginView';
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

function App() {
  const { isLocked, passwords, deletePassword, addPassword, updatePassword, lock } = useVaultStore();
  const { lockVault: lockBackground } = useBackgroundMessage();

  const [hasMasterPassword, setHasMasterPassword] = useState(null);
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

 useEffect(() => {
    const checkMasterPassword = async () => {
      if (!chrome?.storage?.local) return;

      chrome.storage.local.get(
        ["token", "hasMasterPassword", "masterPasswordHash", "masterPasswordSalt", "userId"],
        async ({ token, hasMasterPassword, masterPasswordHash, masterPasswordSalt, userId }) => {
          if (!token) {
            console.log("No token found — user must log in.");
            setHasMasterPassword(false);
            return;
          }

          try {
            // Check the API first
            const res = await fetch("http://localhost:3000/api/master_password", {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`API check failed: ${res.status}`);
            const data = await res.json();
            const apiHasMasterPassword = !!data.has_master_password;

            if (!apiHasMasterPassword) {
              console.log("No master password found on API — forcing setup mode.");
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
              console.log("API master password detected — syncing local storage.");
              await chrome.storage.local.set({ hasMasterPassword: true });
            }

            setHasMasterPassword(true);
          } catch (err) {
            console.warn("Could not reach API (offline mode or request error).", err);

            // Offline fallback
            if (masterPasswordHash && masterPasswordSalt) {
              console.log("Offline mode — local master password available.");
              setHasMasterPassword(true);
            } else {
              console.log("No local master password — user must set up a new one.");
              setHasMasterPassword(false);
            }
          }
        }
      );
    };

    checkMasterPassword();
  }, []);

  // Local integrity check
  useEffect(() => {
    const verifyLocalMasterPassword = async () => {
      chrome.storage.local.get(["hasMasterPassword", "masterPasswordHash", "masterPasswordSalt"], (result) => {
        const { hasMasterPassword, masterPasswordHash, masterPasswordSalt } = result;

        if (hasMasterPassword && (!masterPasswordHash || !masterPasswordSalt)) {
          console.warn("[App] Inconsistent local master password data — resetting setup.");
          chrome.storage.local.remove(["hasMasterPassword", "masterPasswordHash", "masterPasswordSalt"], () => {
            setHasMasterPassword(false);
          });
        }
      });
    };

    verifyLocalMasterPassword();
  }, []);

  if (hasMasterPassword === null) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!hasMasterPassword) {
    return (
      <div className="app">
        <SetupMasterPasswordView onSetupComplete={() => setHasMasterPassword(true)} />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="app">
        <LoginView />
      </div>
    );
  }

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
