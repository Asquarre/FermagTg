// src/components/ProductList.js

import React from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';

const ProductList = ({
  products,
  searchTerm,
  onAdd,
  onRemove,
  onBack,
  onCheckout,
  cart,
}) => {
  return (
    <div>
      {/* Back to Categories Button */}
      <button className="back-to-categories-button" onClick={onBack}>
        &larr; Back to Categories
      </button>

      {/* Product List */}
      <h2>Products</h2>
      {products.length > 0 ? (
        <Flipper flipKey={products.map((product) => product.id).join(',')}>
          <div>
            {products.map((product) => {
              // Highlight matching search term
              const regex = new RegExp(`(${searchTerm})`, 'gi');
              const productNameHighlighted = product.name.replace(
                regex,
                '<mark>$1</mark>'
              );

              return (
                <Flipped key={product.id} flipId={product.id}>
                  <div className="product-item">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: productNameHighlighted,
                      }}
                    ></span>
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        marginTop: '10px',
                      }}
                    >
                      <button
                        className="quantity-button"
                        onClick={() => onAdd(product.id)}
                      >
                        +
                      </button>
                      <button
                        className="quantity-button"
                        onClick={() => onRemove(product.id)}
                      >
                        -
                      </button>
                    </div>
                  </div>
                </Flipped>
              );
            })}
          </div>
        </Flipper>
      ) : (
        <p>No products available.</p>
      )}

      {/* Shopping Cart */}
      {/* ... existing shopping cart code ... */}

      {/* Button Container */}
      {/* ... existing button container code ... */}
    </div>
  );
};

export default ProductList;
