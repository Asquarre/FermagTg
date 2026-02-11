import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import AnimatedNumber from './AnimatedNumber';
import { formatPrice } from '../utils';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const FALLBACK_IMAGE = '/product-images/Default.avif';
const FALLBACK_SOURCES = {
  avif: FALLBACK_IMAGE,
  webp: undefined,
  fallback: FALLBACK_IMAGE,
};

const buildImageSources = (src) => {
  if (!src || src === FALLBACK_IMAGE) {
    return FALLBACK_SOURCES;
  }

  const [pathWithoutQuery, queryString] = src.split('?');
  const extensionIndex = pathWithoutQuery.lastIndexOf('.');

  if (extensionIndex === -1) {
    return {
      avif: undefined,
      webp: undefined,
      fallback: src,
    };
  }

  const basePath = pathWithoutQuery.slice(0, extensionIndex);
  const query = queryString ? `?${queryString}` : '';
  const extension = pathWithoutQuery.slice(extensionIndex + 1).toLowerCase();

  const avifSource = `${basePath}.avif${query}`;
  const webpSource = `${basePath}.webp${query}`;

  if (extension === 'avif') {
    return {
      avif: src,
      webp: webpSource,
      fallback: webpSource,
    };
  }

  if (extension === 'webp') {
    return {
      avif: avifSource,
      webp: src,
      fallback: src,
    };
  }

  return {
    avif: avifSource,
    webp: webpSource,
    fallback: src,
  };
};

const handleImageError = (event) => {
  const img = event.currentTarget;
  img.onerror = null;

  const picture = img.closest('picture');
  if (picture) {
    const sources = picture.querySelectorAll('source');
    sources.forEach((source) => {
      source.remove();
    });
  }

  img.src = FALLBACK_IMAGE;
};

const ProductList = ({ products, onAdd, onRemove, onSetQuantity, onBack, onCheckout, cart }) => {
  const nodeRefs = useRef(new Map());
const [quantityDrafts, setQuantityDrafts] = useState({});

  useEffect(() => {
    const nextDrafts = {};
    cart.forEach((item) => {
      nextDrafts[item.id] = String(item.quantity);
    });
    setQuantityDrafts(nextDrafts);
  }, [cart]);
  const getNodeRef = (id) => {
    if (!nodeRefs.current.has(id)) {
      nodeRefs.current.set(id, React.createRef());
    }
    return nodeRefs.current.get(id);
  };
  const getProductQuantity = (productId) => {
    const item = cart.find((cartItem) => cartItem.id === productId);
    return item ? item.quantity : 0;
  };

  const handleQuantityChange = (productId, value) => {
    const digitsOnly = value.replace(/\D/g, '');
    setQuantityDrafts((prev) => ({
      ...prev,
      [productId]: digitsOnly,
    }));
  };

  const applyQuantity = (productId) => {
    const rawValue = quantityDrafts[productId] ?? '';

    if (rawValue === '') {
      onSetQuantity(productId, 0);
      return;
    }

    const parsedValue = Number.parseInt(rawValue, 10);

    if (!Number.isFinite(parsedValue)) {
      setQuantityDrafts((prev) => ({
        ...prev,
        [productId]: String(getProductQuantity(productId)),
      }));
      return;
    }

    onSetQuantity(productId, parsedValue);
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
            const imageSrc = product.image || FALLBACK_IMAGE;
            const { avif, webp, fallback } = buildImageSources(imageSrc);
            const currentQuantity = getProductQuantity(product.id);
            const draftValue = quantityDrafts[product.id] ?? String(currentQuantity);
            const showAnimatedValue = draftValue === String(currentQuantity);
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
                      <p className="product-price">Цена: ₸{formatPrice(product.price)}</p>
                      <div className="product-quantity-controls">
                        <button
                          className="quantity-button"
                          onClick={() => onRemove(product.id)}
                          aria-label={`Уменьшить количество ${product.name}`}
                        >
                          -
                        </button>
                              <label className="product-quantity-input-wrap" aria-label={`Количество ${product.name}`}>
                          {showAnimatedValue ? (
                            <span className="product-quantity-value">
                              <AnimatedNumber className="qty-inline" value={currentQuantity} />
                            </span>
                          ) : null}
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`product-quantity-input ${showAnimatedValue ? 'product-quantity-input--hidden' : ''}`}
                            value={draftValue}
                            onChange={(event) => handleQuantityChange(product.id, event.target.value)}
                            onBlur={() => applyQuantity(product.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.currentTarget.blur();
                              }
                            }}
                            aria-label={`Введите количество для ${product.name}`}
                          />
                        </label>
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
                          src={fallback}
                          alt={product.name}
                          loading="lazy"
                          onError={handleImageError}
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
      image: PropTypes.string,
    })
  ).isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onSetQuantity: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired, // Added this line
  cart: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      catalogueName: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
      image: PropTypes.string,
    })
  ).isRequired,
};

export default ProductList;