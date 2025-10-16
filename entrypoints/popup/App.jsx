import { useState } from 'react';
import LoginView from './components/LoginView';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import PasswordListCompact from './components/PasswordListCompact';
import PasswordDetails from './components/PasswordDetails';
import AddPasswordForm from './components/AddPasswordForm';
import EditPasswordForm from './components/EditPasswordForm';
import useVaultStore from '../../services/vaultStore';
import './style.css';

function App() {
  const { isLocked, passwords, deletePassword, addPassword, updatePassword } = useVaultStore();

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

  const handleLock = () => {
    setSearchQuery('');
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

  if (isLocked) {
    return (
      <div className="app">
        <LoginView />
      </div>
    );
  }

  return (
    <div className="app">
      <Header onLock={handleLock} itemCount={passwords.length} />

      <div className="app-main-three-pane">
        <Sidebar
          vaults={vaults}
          activeVaultId={activeVaultId}
          onVaultChange={setActiveVaultId}
        />

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

        <button
          className="fab-add"
          onClick={() => setShowAddForm(true)}
          title="Add new password"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default App;
