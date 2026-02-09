import './styles.css';

import React, { useState, useEffect } from 'react';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import Checkout from './components/Checkout';
import SearchBar from './components/SearchBar';
import axios from 'axios';
import AnimatedNumber from './components/AnimatedNumber';
import { formatPrice } from './utils';
import { categories as categoriesData, productsByCategory } from './data/products';
import { normalizeProductName, readExcelCatalog } from './excel/excelLoader';


const App = () => {
    useEffect(() => {
    import('./styles.css');
  }, []);
  useEffect(() => {
    const backgroundImage = new Image();
    backgroundImage.src = '/background.png';

    const updateBackgroundVars = () => {
      if (!backgroundImage.naturalWidth || !backgroundImage.naturalHeight) {
        return;
      }

      const isWideViewport = window.matchMedia('(min-width: 768px)').matches;
      const targetWidth = isWideViewport
        ? window.innerWidth
        : backgroundImage.naturalWidth;
      const targetHeight = Math.round(
        (backgroundImage.naturalHeight / backgroundImage.naturalWidth) * targetWidth
      );

      document.documentElement.style.setProperty(
        '--background-image-width',
        `${targetWidth}px`
      );
      document.documentElement.style.setProperty(
        '--background-image-height',
        `${targetHeight}px`
      );
    };

    const handleResize = () => {
      updateBackgroundVars();
    };

    if (backgroundImage.complete) {
      updateBackgroundVars();
    } else {
      backgroundImage.addEventListener('load', updateBackgroundVars);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      backgroundImage.removeEventListener('load', updateBackgroundVars);
    };
  }, []);
  const [categories, setCategories] = useState(categoriesData);
  const [allProducts, setAllProducts] = useState(productsByCategory);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [lastOrder, setLastOrder] = useState([]);
  const [view, setView] = useState('categories'); // 'categories', 'products', 'checkout'
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [priceLoadError, setPriceLoadError] = useState(null);

  useEffect(() => {
     const buildDefaultImagePath = (itemId) =>
      Number.isFinite(itemId) ? `/product-images/${itemId}.webp` : undefined;

    const withImages = (items) =>
      items.map((item) => ({
        ...item,
        image: item.image ?? buildDefaultImagePath(item.id),
      }));

    const addImagesToCatalog = (catalog) =>
      Object.fromEntries(
        Object.entries(catalog).map(([categoryName, items]) => [
          categoryName,
          withImages(items),
        ])
      );

    const categoryPrefixMap = {
      Заморозка: 11,
      'хлебобулочные изделия': 22,
      кондитерка: 33,
      кулинария: 44,
    };

    const loadPrices = async () => {
      try {
        const response = await fetch('/Цены.xlsx');
        if (!response.ok) {
          throw new Error('Не удалось загрузить файл с ценами.');
        }
        const arrayBuffer = await response.arrayBuffer();
       const catalog = await readExcelCatalog(arrayBuffer, { categoryPrefixMap });
        if (!catalog || Object.keys(catalog.productsByCategory).length === 0) {
          throw new Error('Файл цен не содержит данных для обновления.');
        }
         setCategories(catalog.categories);
        setAllProducts(addImagesToCatalog(catalog.productsByCategory));
        setSelectedCategory(null);
        setPriceLoadError(null);
      } catch (error) {
        console.error('Failed to load prices from Excel', error);
        const fallbackMessage =
          'Не удалось автоматически обновить цены. Используются сохраненные значения.';
        const errorDetails =
          error instanceof Error && error.message ? ` (${error.message})` : '';
        setPriceLoadError(`${fallbackMessage}${errorDetails}`);
      } finally {
        setPricesLoaded(true);
      }
    };
    loadPrices();
  }, []);
  

   useEffect(() => {
    if (selectedCategory && allProducts[selectedCategory]) {
      setProducts(allProducts[selectedCategory]);
      setFilteredProducts(allProducts[selectedCategory]);
    }
  }, [allProducts, selectedCategory]);

   useEffect(() => {
    const saved = localStorage.getItem('lastOrder');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalizedOrder = parsed
            .map((item) => {
              if (!item || item.id === undefined || item.id === null) {
                return null;
              }
              const quantity = Number(item.quantity);
              const numericId = Number(item.id);
              return {
                id: Number.isFinite(numericId) ? numericId : item.id,
                name: typeof item.name === 'string' ? item.name : '',
                quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
              };
            })
            .filter(Boolean);

          setLastOrder(normalizedOrder);
          localStorage.setItem('lastOrder', JSON.stringify(normalizedOrder));
        }
      } catch (e) {
        console.error('Failed to parse saved order', e);
      }
    }
  }, []);

  const handleSelectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    const categoryProducts = allProducts[categoryName] || [];
    setProducts(categoryProducts);
    setFilteredProducts(categoryProducts);
    setView('products');
  };

  const handleAddToCart = (productId) => {
    const product = products.find((p) => p.id === productId);
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (productId) => {
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
      if (existingItem.quantity === 1) {
        setCart(cart.filter((item) => item.id !== productId));
      } else {
        setCart(
          cart.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
        );
      }
    }
  };
  const handleDeleteFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

const handleSearch = (term) => {
  if (term.trim() === '') {
    setFilteredProducts(products);
    return;
  }

  const termLower = term.toLowerCase();

  const reordered = products.slice().sort((a, b) => {
    const aMatches = a.name.toLowerCase().includes(termLower) ? 1 : 0;
    const bMatches = b.name.toLowerCase().includes(termLower) ? 1 : 0;
    // Sort so that matching products come first
    return bMatches - aMatches;
  });

  setFilteredProducts(reordered);
};

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Ваша корзина пуста.');
      return;
    }
    setView('checkout');
  };

  const handleOrderSubmit = (orderDetails) => {
    return axios
      .post('/api/submit-order', {
        customerName: orderDetails.customerName || '',
        user_id: orderDetails.user_id || '', // Include user_id
        address: orderDetails.address,
        phone: orderDetails.phone,
        fulfillmentType: orderDetails.fulfillmentType || '',
        items: cart,
        timestamp: orderDetails.timestamp,
      })
      .then(() => {
        alert('Мы приняли ваш заказ!');
        const orderSnapshot = cart
          .map((item) => {
            if (item.id === undefined || item.id === null) {
              return null;
            }
            const numericId = Number(item.id);
            const quantityValue = Number(item.quantity);
            return {
              id: Number.isFinite(numericId) ? numericId : item.id,
              name: item.name,
              quantity: Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1,
            };
          })
          .filter(Boolean);
        localStorage.setItem('lastOrder', JSON.stringify(orderSnapshot));
        setLastOrder(orderSnapshot);
        setCart([]);
        setView('categories');
      })
      .catch(() => {
        alert('Ошибка!');
        throw new Error('Order submission failed');
      });
  };

  const handleRepeatOrder = () => {
    if (lastOrder && lastOrder.length > 0) {
      const productMapById = new Map();
      const productMapByName = new Map();

      
      Object.values(allProducts).forEach((items = []) => {
        items.forEach((item) => {
          productMapById.set(item.id, item);
          if (item.name) {
            productMapByName.set(normalizeProductName(item.name), item);
          }
          if (item.catalogueName) {
            productMapByName.set(normalizeProductName(item.catalogueName), item);
          }
        });
      });


      const reconstructedCart = [];
      const missingItems = [];

      lastOrder.forEach((savedItem) => {
        const productById = productMapById.get(savedItem.id);
        let product = productById;


        if (!product && typeof savedItem.name === 'string' && savedItem.name.trim()) {
          product = productMapByName.get(normalizeProductName(savedItem.name));
        }


        if (!product) {
          missingItems.push(savedItem.name || `ID ${savedItem.id}`);
          return;
        }

        const quantity = Number(savedItem.quantity);
        reconstructedCart.push({
          ...product,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        });
      });

      if (reconstructedCart.length === 0) {
        alert(
          missingItems.length > 0
            ? `Не удалось повторить заказ. Товары недоступны: ${missingItems.join(', ')}`
            : 'Предыдущий заказ отсутствует.'
        );
        return;
      }

      if (missingItems.length > 0) {
        alert(`Некоторые товары недоступны и не были добавлены: ${missingItems.join(', ')}`);
      }

      setCart(reconstructedCart);
      if (categories.length > 0) {
        const firstCategoryName = categories[0].name;
        setSelectedCategory(firstCategoryName);
        setProducts(allProducts[firstCategoryName]);
        setFilteredProducts(allProducts[firstCategoryName]);
      }
      setView('checkout');
    } else {
      alert('Предыдущий заказ отсутствует.');
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
       <picture>
          <source srcSet="/Logo.avif" type="image/avif" />
          <source srcSet="/Logo.webp" type="image/webp" />
          <img
            src="/Logo.png"
            alt="Grocery Store Logo"
            className="app-logo"
          />
        </picture>
        {view === 'categories' && lastOrder && lastOrder.length > 0 && (
          <button
            className="repeat-order-button fade-in"
            onClick={handleRepeatOrder}
          >
            Повторить прошлый заказ 🔁
          </button>
        )}
      </header>
      {!pricesLoaded && (
        <div
          className="price-status-message"
          style={{ marginBottom: '12px', color: '#555' }}
        >
          Загрузка актуальных цен...
        </div>
      )}
      {priceLoadError && (
        <div
          className="price-status-message"
          style={{ marginBottom: '12px', color: '#b3261e' }}
        >
          {priceLoadError}
        </div>
      )}
      {view === 'categories' && (
        <Categories
          categories={categories}
          onSelectCategory={handleSelectCategory}

        />
      )}
      {view === 'products' && (
        <>
          <SearchBar onSearch={handleSearch} />
          <ProductList
            products={filteredProducts}
            onAdd={handleAddToCart}
            onRemove={handleRemoveFromCart}
            onBack={() => setView('categories')}
            onCheckout={handleCheckout} // Pass handleCheckout here
            cart={cart}
          />
<div className="checkout-order-summary">
            <h3><strong>Ваш заказ</strong></h3>
            {cart.length ? (
              <>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {cart.map((item) => (
                    <li key={item.id} className="checkout-item">
                      <span className="checkout-item-name">{item.name}</span>
                      <div className="checkout-item-quantity">
                        <button
                          className="quantity-button"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          -
                        </button>
                        <AnimatedNumber
                          value={item.quantity}
                          className="quantity-value"
                        />
                        <button
                          className="quantity-button"
                          onClick={() => handleAddToCart(item.id)}
                        >
                          +
                        </button>
                      </div>
                      <span className="checkout-item-price">
                        ₸
                        <AnimatedNumber
                          value={formatPrice(item.quantity * item.price)}
                        />
                      </span>
                      <button
                        className="remove-item-button"
                        onClick={() => handleDeleteFromCart(item.id)}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="total">
                  Сумма Заказа: ₸
                  <AnimatedNumber
                    value={formatPrice(
                      cart.reduce(
                        (acc, item) => acc + item.quantity * item.price,
                        0
                      )
                    )}
                  />
                </div>
              </>
            ) : (
            <p>Ваша Корзина Пуста.</p>

            )}
          </div>
          {/* The Checkout button has been moved to ProductList.js */}
        </>
      )}
      {view === 'checkout' && (
        <Checkout
          cart={cart}
          onSubmit={handleOrderSubmit}
          onBack={() => setView('products')}
          onAdd={handleAddToCart}
          onRemove={handleRemoveFromCart}
          onDelete={handleDeleteFromCart}
        />
      )}
    </div>
  );
};

export default App;
