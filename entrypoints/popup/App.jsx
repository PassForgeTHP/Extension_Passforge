import { useState } from 'react';
import LoginView from './components/LoginView';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import PasswordListCompact from './components/PasswordListCompact';
import PasswordDetails from './components/PasswordDetails';
import AddPasswordForm from './components/AddPasswordForm';
import useVaultStore from '../../services/vaultStore';
import './style.css';

function App() {
  const { isLocked, passwords, deletePassword, addPassword, updatePassword } = useVaultStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [selectedPassword, setSelectedPassword] = useState(null);

  const handleLock = () => {
    setSearchQuery('');
  };

  // Filter by view
  let viewFilteredPasswords = passwords;
  if (activeView === 'passwords') {
    viewFilteredPasswords = passwords.filter(pwd => pwd.password);
  } else if (activeView === 'notes') {
    viewFilteredPasswords = passwords.filter(pwd => pwd.notes);
  } else if (activeView === 'favorites') {
    viewFilteredPasswords = passwords.filter(pwd => pwd.favorite);
  }

  // Filter by search query
  const filteredPasswords = viewFilteredPasswords.filter(pwd =>
    pwd.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pwd.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pwd.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <div className="middle-pane">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <PasswordListCompact
            passwords={filteredPasswords}
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
            const updatedData = {
              name: password.name,
              domain: password.domain,
              username: password.username,
              password: password.password,
              notes: password.notes
            };
            updatePassword(password.id, updatedData);
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
