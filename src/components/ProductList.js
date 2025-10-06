import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import AnimatedNumber from './AnimatedNumber';
import { formatPrice } from '../utils';
import { TransitionGroup, CSSTransition } from 'react-transition-group';


const FALLBACK_IMAGE = '/product-images/default.svg';

const buildDefaultSources = (id) => {
  if (typeof id !== 'number') {
    return {};
  }

  const basePath = `/product-images/${id}`;
  return {
    avif: `${basePath}.avif`,
    webp: `${basePath}.webp`,
  };
};

const resolveImageSources = (product) => {
  const defaults = buildDefaultSources(product.id);
  const { image } = product;

  if (!image) {
    return {
      ...defaults,
      fallback: defaults.webp ?? FALLBACK_IMAGE,
    };
  }

  if (typeof image === 'string') {
    return {
      ...defaults,
      fallback: image,
    };
  }

  const fallback =
    image.fallback ??
    image.src ??
    image.default ??
    defaults.webp ??
    FALLBACK_IMAGE;

  return {
    ...defaults,
    ...image,
    fallback,
  };
};


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
            const { avif, webp, fallback } = resolveImageSources(product);
            return (
              <CSSTransition
                key={product.id}
                nodeRef={nodeRef}
                timeout={300}
                classNames="product-shrink"
              >
                <div ref={nodeRef} className="product-item product-item-animated">
                   <div className="product-content">
                    <div className="product-details">
                      <h3>{product.name}</h3>
                      <p>Цена: ₸{formatPrice(product.price)}</p>
                      <div className="product-quantity-controls">
                        <button
                          className="quantity-button"
                          onClick={() => onRemove(product.id)}
                          aria-label={`Уменьшить количество ${product.name}`}
                        >
                          -
                        </button>
                        <span className="product-quantity-value">
                          <AnimatedNumber
                            className="qty-inline"
                            value={getProductQuantity(product.id)}
                          />
                        </span>
                        <button
                          className="quantity-button"
                          onClick={() => onAdd(product.id)}
                          aria-label={`Увеличить количество ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="product-image-wrapper">
                      <picture>
                        {avif && <source srcSet={avif} type="image/avif" />}
                        {webp && <source srcSet={webp} type="image/webp" />}
                        <img
                          src={fallback || FALLBACK_IMAGE}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            if (event.currentTarget.src !== FALLBACK_IMAGE) {
                              event.currentTarget.src = FALLBACK_IMAGE;
                            }
                          }}
                        />
                      </picture>
                    </div>
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
      image: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          avif: PropTypes.string,
          webp: PropTypes.string,
          fallback: PropTypes.string,
        }),
      ]),
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
      image: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          avif: PropTypes.string,
          webp: PropTypes.string,
          fallback: PropTypes.string,
        }),
      ]),
    })
  ).isRequired,
};

export default ProductList;