import React from 'react';

const Categories = ({ categories, onSelectCategory }) => {
  return (
    <div>
      <h2>Categories</h2>
      <ul
        style={{
          listStyleType: 'none',
          padding: 0,
          display: 'flex', // Enable flexbox
          flexDirection: 'column', // Stack buttons vertically
          alignItems: 'flex-start', // Align to the left (can change to 'center' if needed)
          gap: '10px', // Add spacing between buttons
        }}
      >
        {categories.map((category) => (
          <li key={category.id} style={{ width: '100%' }}>
            <button
              className="category-button"
              onClick={() => onSelectCategory(category.name)}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;

