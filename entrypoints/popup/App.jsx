import { useState } from 'react';
import LoginView from './components/LoginView';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import PasswordList from './components/PasswordList';
import AddPasswordForm from './components/AddPasswordForm';
import useVaultStore from '../../services/vaultStore';
import './style.css';

function App() {
  const { isLocked, passwords, deletePassword, addPassword, updatePassword } = useVaultStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeView, setActiveView] = useState('all');

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

      <div className="app-main">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <div className="content-area">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <PasswordList
            passwords={filteredPasswords}
            copiedId={copiedId}
            onCopyUsername={copyToClipboard}
            onCopyPassword={copyToClipboard}
            onDelete={deletePassword}
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

          <div className="footer">
            <button className="btn-add" onClick={() => setShowAddForm(true)}>+ Add Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
