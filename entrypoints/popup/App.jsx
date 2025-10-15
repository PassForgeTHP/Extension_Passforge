import { useState } from 'react';
import LoginView from './components/LoginView';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import PasswordList from './components/PasswordList';
import AddPasswordForm from './components/AddPasswordForm';
import useVaultStore from '../../services/vaultStore';
import './style.css';

function App() {
  const { isLocked, passwords, deletePassword, addPassword } = useVaultStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleLock = () => {
    setSearchQuery('');
  };

  const filteredPasswords = passwords.filter(pwd =>
    pwd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pwd.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pwd.domain.toLowerCase().includes(searchQuery.toLowerCase())
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
      <Header onLock={handleLock} />

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <PasswordList
        passwords={filteredPasswords}
        copiedId={copiedId}
        onCopyUsername={copyToClipboard}
        onCopyPassword={copyToClipboard}
        onDelete={deletePassword}
        onEdit={(password) => console.log('Edit:', password)}
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
  );
}

export default App;
