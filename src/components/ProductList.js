import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import AnimatedNumber from './AnimatedNumber';
import { formatPrice } from '../utils';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const ProductList = ({ products, onAdd, onRemove, onBack, onCheckout, cart }) => {
  const nodeRefs = useRef(new Map());

  const getNodeRef = (id) => {
    if (!nodeRefs.current.has(id)) {
      nodeRefs.current.set(id, React.createRef());
    }
    return nodeRefs.current.get(id);
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
        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}
      >
        <button className="back-to-categories-button" onClick={onBack}>
          &larr; Назад 
        </button>
        <button className="checkout-button" onClick={onCheckout}>
          Оформить Заказ
        </button>
      </div>

      <h2 className="products-heading">Продукты</h2>
      {products.length === 0 ? (
        <p>No products available in this category.</p>
      ) : (
         <TransitionGroup className="row">
          {products.map((product) => {
            const nodeRef = getNodeRef(product.id);
            return (
              <CSSTransition
                key={product.id}
                nodeRef={nodeRef}
                timeout={300}
                classNames="product-shrink"
              >
                <div ref={nodeRef} className="product-item product-item-animated">
                  <h3>{product.name}</h3>
                  <p>Цена: ₸{formatPrice(product.price)}</p>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button className="quantity-button" onClick={() => onRemove(product.id)}>
                      -
                    </button>
                    <span style={{ margin: '0 10px' }}>
                      <AnimatedNumber
                        className="qty-inline"
                        value={getProductQuantity(product.id)}
                      />
                    </span>
                    <button className="quantity-button" onClick={() => onAdd(product.id)}>
                      +
                    </button>
                  </div>
                </div>
              </CSSTransition>
            );
          })}
        </TransitionGroup>
      )}
    </div>
  );
};

ProductList.propTypes = {
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      catalogueName: PropTypes.string.isRequired,
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
      catalogueName: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default ProductList;