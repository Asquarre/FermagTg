import React from 'react';

const Categories = ({ categories, onSelectCategory, onRepeatOrder, showRepeatButton }) => {
  return (
    <div style={{ position: 'relative' }}>
      {showRepeatButton && (
        <button
          className="repeat-order-button"
          style={{ position: 'absolute', top: 0, right: 0 }}
          onClick={onRepeatOrder}
        >
          Повторить заказ
        </button>
      )}
      <h2 className="categories-heading">КАТЕГОРИИ</h2>
      <ul
        style={{
          listStyleType: 'none',
          padding: 0,
          display: 'flex', // Enable flexbox
          flexDirection: 'column', // Stack buttons  vertically
          alignItems: 'flex-start', // Align to the left (can change to 'center' if needed)
          gap: '10px', // Add spacing between buttons
        }}
      >
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

