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
  console.log('[DEBUG] App component rendering started');

  const { isLocked, isAutoLocked, passwords, deletePassword, addPassword, updatePassword, lock } = useVaultStore();
  const { lockVault: lockBackground } = useBackgroundMessage();

  console.log('[DEBUG] Vault store initialized:', { isLocked, isAutoLocked, passwordsCount: passwords.length });

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

  const handleLock = async () => {
    // Just lock the vault without logging out
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
     console.log('[DEBUG] useEffect for onboarding check triggered');

     const checkOnboardingStatus = async () => {
       console.log('[DEBUG] Starting onboarding status check');

       try {
         console.log('[DEBUG] Checking Chrome API availability:', { chrome: !!chrome, storage: !!chrome?.storage, local: !!chrome?.storage?.local });

         if (!chrome?.storage?.local) {
           console.error('[DEBUG] Chrome storage API not available');
           setHasToken(false);
           setHasSeenExplainer(true);
           setHasMasterPassword(false);
           return;
         }

         console.log('[DEBUG] Chrome storage API available, getting data...');

         chrome.storage.local.get(
           ["token", "hasSeenExplainer", "hasMasterPassword", "masterPasswordHash", "masterPasswordSalt"],
           async ({ token, hasSeenExplainer, hasMasterPassword, masterPasswordHash, masterPasswordSalt }) => {
             console.log('[DEBUG] Chrome storage data retrieved:', {
               hasToken: !!token,
               hasSeenExplainer: !!hasSeenExplainer,
               hasMasterPassword: !!hasMasterPassword,
               hasHash: !!masterPasswordHash,
               hasSalt: !!masterPasswordSalt
             });

             try {
               // Step 1: Check if token exists (account linked)
               if (!token) {
                 console.log('[DEBUG] No token found, setting onboarding defaults');
                 setHasToken(false);
                 setHasSeenExplainer(true); // Skip explainer if no token
                 setHasMasterPassword(false);
                 return;
               }

               console.log('[DEBUG] Token found, proceeding with onboarding check');
               setHasToken(true);

               // Step 2: Check if user has seen the explainer
               setHasSeenExplainer(!!hasSeenExplainer);
               console.log('[DEBUG] Explainer status:', !!hasSeenExplainer);

               // Step 3: Check if user has Master Password
               try {
                 // Check the API first
                 const API_URL = import.meta.env.VITE_API_URL || 'https://passforge-api.onrender.com';
                 console.log('[DEBUG] Checking API for master password at:', API_URL);

                 const res = await fetch(`${API_URL}/api/master_password`, {
                   headers: { Authorization: `Bearer ${token}` }
                 });

                 console.log('[DEBUG] API response status:', res.status);

                 if (!res.ok) {
                   console.error('[DEBUG] API check failed with status:', res.status);
                   throw new Error(`API check failed: ${res.status}`);
                 }

                 const data = await res.json();
                 console.log('[DEBUG] API response data:', data);

                 const apiHasMasterPassword = !!data.has_master_password;
                 console.log('[DEBUG] API has master password:', apiHasMasterPassword);

                 if (!apiHasMasterPassword) {
                   console.log('[DEBUG] API says no master password, clearing local data');
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
                   console.log('[DEBUG] Syncing local state with API');
                   await chrome.storage.local.set({ hasMasterPassword: true });
                 }

                 setHasMasterPassword(true);
                 console.log('[DEBUG] Master password check completed successfully');
               } catch (err) {
                 console.warn('[DEBUG] API check failed, using offline fallback:', err.message);
                 // Offline fallback
                 if (masterPasswordHash && masterPasswordSalt) {
                   console.log('[DEBUG] Using offline fallback - master password exists locally');
                   setHasMasterPassword(true);
                 } else {
                   console.log('[DEBUG] No local master password either');
                   setHasMasterPassword(false);
                 }
               }
             } catch (error) {
               console.error('[DEBUG] Error in onboarding check:', error);
               // Set defaults on error
               setHasToken(false);
               setHasSeenExplainer(true);
               setHasMasterPassword(false);
             }
           }
         );
       } catch (error) {
         console.error('[DEBUG] Error accessing chrome storage:', error);
         // Set defaults if chrome storage fails
         setHasToken(false);
         setHasSeenExplainer(true);
         setHasMasterPassword(false);
       }
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

  console.log('[DEBUG] Render logic - current state:', {
    hasToken,
    hasSeenExplainer,
    hasMasterPassword,
    isLocked,
    isAutoLocked
  });

  // Loading state - checking onboarding status
  if (hasToken === null || hasSeenExplainer === null || hasMasterPassword === null) {
    console.log('[DEBUG] Rendering loading screen');
    return <div className="loading-screen" style={{ padding: '20px', backgroundColor: '#333', color: 'white' }}>Loading...</div>;
  }

  // Step 1: Link Account - User must paste JWT token from web app
  if (!hasToken) {
    console.log('[DEBUG] Rendering LinkAccountView');
    return (
      <div className="app">
        <LinkAccountView
          onLinkComplete={() => {
            console.log('[DEBUG] LinkAccountView completed');
            setHasToken(true);
            setHasSeenExplainer(false); // Show explainer after linking
          }}
        />
      </div>
    );
  }

  // Step 2: Master Password Explainer - Educational carousel about Zero-Knowledge
  if (!hasSeenExplainer) {
    console.log('[DEBUG] Rendering MasterPasswordExplainerView');
    return (
      <div className="app">
        <MasterPasswordExplainerView
          onComplete={() => {
            console.log('[DEBUG] MasterPasswordExplainerView completed');
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
    console.log('[DEBUG] Rendering SetupMasterPasswordView');
    return (
      <div className="app">
        <SetupMasterPasswordView
          onSetupComplete={() => {
            console.log('[DEBUG] SetupMasterPasswordView completed');
            setHasMasterPassword(true);
          }}
        />
      </div>
    );
  }

  // Step 4: Login - Unlock vault with Master Password (when vault is locked manually)
  // Skip login screen when auto-locked to avoid popup spam
  if (isLocked && !isAutoLocked) {
    console.log('[DEBUG] Rendering LoginView');
    return (
      <div className="app">
        <LoginView />
      </div>
    );
  }

  // Step 5: Main App - Password management interface
  console.log('[DEBUG] Rendering main app interface');

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
          onLock={handleLock}
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
