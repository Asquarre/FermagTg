// src/components/ProductList.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const ProductList = ({ products, onAdd, onBack, onCheckout, cart }) => {
  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (productId, value) => {
    setQuantities({
      ...quantities,
      [productId]: value,
    });
  };

  const handleAddClick = (productId) => {
    const quantity = parseFloat(quantities[productId]);
    if (quantity > 0) {
      onAdd(productId, quantity);
      setQuantities({ ...quantities, [productId]: '' }); // Reset input
    } else {
      alert('Please enter a valid quantity.');
    }
  };

  const getProductQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
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
                <input
                  type="number"
                  step={product.unit === 'kg' ? '0.01' : '1'}
                  min="0"
                  placeholder={`Quantity in ${product.unit}`}
                  value={quantities[product.id] || ''}
                  onChange={(e) =>
                    handleQuantityChange(product.id, e.target.value)
                  }
                  style={{ width: '150px', marginRight: '10px' }}
                />
                <button
                  className="quantity-button"
                  onClick={() => handleAddClick(product.id)}
                >
                  Add to Cart
                </button>
              </div>
              {/* Display current quantity in cart */}
              <p>
                In Cart: {getProductQuantity(product.id)} {product.unit}
              </p>
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
  onBack: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      unit: PropTypes.string.isRequired, // Changed from price to unit
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default ProductList;
