import React from 'react';

const Categories = ({ categories, onSelectCategory }) => {
  return (
    <div className="categories-view">
      <h2 className="categories-heading">КАТЕГОРИИ</h2>
      <ul className="categories-list">
        {categories.map((category, index) => (
          <li
            key={category.id}
            style={{ width: '100%', animationDelay: `${index * 0.1}s` }}
            className="fade-in"
          >
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

