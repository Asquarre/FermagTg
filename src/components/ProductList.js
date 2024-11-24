import React from 'react';
import PropTypes from 'prop-types';

const ProductList = ({ products, onAdd, onRemove, onBack, onCheckout, cart }) => {
  const getProductQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div>
      {/* Top Buttons */}
      <div
        className="top-buttons"
        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}
      >
        <button className="back-to-categories-button" onClick={onBack}>
          &larr; Back to Categories
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
              <p>Price: ${product.price.toFixed(2)}</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button className="quantity-button" onClick={() => onRemove(product.id)}>
                  -
                </button>
                <span style={{ margin: '0 10px' }}>
                  {getProductQuantity(product.id)}
                </span>
                <button className="quantity-button" onClick={() => onAdd(product.id)}>
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
      price: PropTypes.number.isRequired,
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired, // Added this line
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default ProductList;
