import { useState } from 'react';
import LoginView from './components/LoginView';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import PasswordList from './components/PasswordList';
import useVaultStore from '../../services/vaultStore';
import './style.css';

function App() {
  const [isLocked, setIsLocked] = useState(true);

  // Mock data for testing
  const [passwords] = useState([
    { id: 1, name: 'GitHub', username: 'user@example.com', password: 'pass123', domain: 'github.com' },
    { id: 2, name: 'Gmail', username: 'myemail@gmail.com', password: 'securepass', domain: 'gmail.com' },
    { id: 3, name: 'Twitter', username: '@myhandle', password: 'twitterpass', domain: 'twitter.com' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const handleLock = () => {
    setIsLocked(true);
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
        <LoginView onUnlock={handleUnlock} />
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
      />

      <div className="footer">
        <button className="btn-add">+ Add Password</button>
      </div>
    </div>
  );
}

export default App;
