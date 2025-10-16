import {
  HiViewGrid,
  HiKey,
  HiDocumentText,
  HiCog,
  HiStar
} from 'react-icons/hi';

function Sidebar({ activeView, onViewChange }) {
  const menuItems = [
    { id: 'all', icon: HiViewGrid, label: 'All Items' },
    { id: 'passwords', icon: HiKey, label: 'Passwords' },
    { id: 'notes', icon: HiDocumentText, label: 'Notes' },
    { id: 'favorites', icon: HiStar, label: 'Favorites' },
  ];

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={item.label}
            >
              <Icon className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
