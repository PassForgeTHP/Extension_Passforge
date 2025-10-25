import { HiSearch, HiX } from 'react-icons/hi';

function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <HiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, username or domain..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="search-input"
        />
        {value && (
          <button
            className="clear-search-btn"
            onClick={() => onChange('')}
            title="Clear search"
          >
            <HiX />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
