function Header({ onLock }) {
  return (
    <div className="header">
      <div className="header-left">
        <h1 className="header-title">PassForge</h1>
      </div>
      <button className="btn-lock" onClick={onLock}>
        Lock
      </button>
    </div>
  );
}

export default Header;
