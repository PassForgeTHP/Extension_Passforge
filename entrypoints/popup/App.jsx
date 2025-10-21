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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const checkMasterPassword = async () => {
      if (!chrome?.storage) return;

      chrome.storage.local.get('token', async ({ token }) => {
        console.log("Token from chrome.storage :", token);
        if (!token) return;

        try {
          const res = await fetch('http://localhost:3000/api/master_password', {
            headers: { Authorization: `Bearer ${token}` },
          });

          // console.log("Status de la réponse :", res.status);
          const data = await res.json();
          // console.log("Data recieved :", data);

          setHasMasterPassword(data.has_master_password);
        } catch (err) {
          console.error('Error while verifying the master password :', err);
        }
      });
    };

    checkMasterPassword();
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

  return (
    <div className="app">
      <Header onAdd={() => setShowAddForm(true)} itemCount={passwords.length}>
        <BurgerMenu
          vaults={vaults}
          activeVaultId={activeVaultId}
          onVaultChange={setActiveVaultId}
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
      </div>
    </div>
  );
}

export default App;
