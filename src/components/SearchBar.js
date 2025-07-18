import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [term, setTerm] = useState('');

  const handleSearch = () => {
    onSearch(term);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Искать продукты..."
        className="search-input"
      />
      <button className="search-button" onClick={handleSearch}>
        Найти
      </button>
    </div>
  );
};

export default SearchBar;
