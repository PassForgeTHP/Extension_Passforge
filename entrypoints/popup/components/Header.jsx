import { HiShieldCheck } from 'react-icons/hi';

function Header({ onAdd, itemCount = 0, children }) {
  return (
    <div className="header">
      <div className="header-left">
        {children}
        <div className="header-logo">
          <HiShieldCheck className="logo-icon" />
          <span className="logo-text">PassForge</span>
        </div>
        {itemCount > 0 && (
          <div className="item-badge">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>
      <button className="btn-add-header" onClick={onAdd} title="Add new password">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}

export default Header;
