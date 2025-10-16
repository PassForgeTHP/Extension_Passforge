import { HiLockClosed, HiShieldCheck } from 'react-icons/hi';

function Header({ onLock, itemCount = 0 }) {
  return (
    <div className="header">
      <div className="header-left">
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
      <button className="btn-lock" onClick={onLock}>
        <HiLockClosed className="lock-icon" />
        <span>Lock</span>
      </button>
    </div>
  );
}

export default Header;
