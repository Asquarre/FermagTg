// src/components/ProductList.js
import React from 'react';
import PropTypes from 'prop-types';

const ProductList = ({ products, onAdd, onRemove, onBack, onCheckout, cart }) => {
  const getProductQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const getStepValue = (unit) => {
    return unit === 'kg' ? 0.1 : 1;
  };

  return (
    <div>
      {/* Top Buttons */}
      <div
        className="top-buttons"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <button className="back-to-categories-button" onClick={onBack}>
          &larr; Back
        </button>
        <button className="checkout-button" onClick={onCheckout}>
          Checkout
        </button>
      </div>

      <h2>Products</h2>
      {products.length === 0 ? (
        <p>No products available in this category.</p>
      ) : (
        <div className="row">
          {products.map((product) => (
            <div key={product.id} className="product-item">
              <h3>{product.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  className="quantity-button"
                  onClick={() => onRemove(product.id)}
                >
                  -
                </button>
                <span style={{ margin: '0 10px' }}>
                  {getProductQuantity(product.id)} {product.unit}
                </span>
                <button
                  className="quantity-button"
                  onClick={() => onAdd(product.id)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ProductList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      unit: PropTypes.string.isRequired, // Changed from price to unit
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired, // Changed from price to unit
    })
  ).isRequired,
};

export default ProductList;
