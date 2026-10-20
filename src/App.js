import React, { useState, useEffect, useRef } from 'react';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import Checkout from './components/Checkout';
import SearchBar from './components/SearchBar';
import axios from 'axios';
import AnimatedNumber from './components/AnimatedNumber';
import { formatPrice } from './utils';
import { useLiveCatalog, updateCartPrices, pricesDiffer } from './liveCatalog';
import { loadLastOrder, saveLastOrder } from './orderStorage';
import { loadPendingOrder, preparePendingOrder, clearPendingOrder } from './pendingOrder';


const App = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [lastOrder, setLastOrder] = useState(loadLastOrder);
  const [view, setView] = useState('categories'); // 'categories', 'products', 'checkout'
  const [pendingOrder, setPendingOrder] = useState(loadPendingOrder);
  const { catalog, refresh: refreshCatalog } = useLiveCatalog(Boolean(pendingOrder));
  const categories = catalog.categories;
  const allProducts = catalog.productsByCategory;
  const [priceNotice, setPriceNotice] = useState(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    const byId = new Map(Object.values(catalog.productsByCategory).flat().map((p) => [p.id, p]));
    setProducts((items) => items.map((item) => byId.get(item.id) || item));
    setFilteredProducts((items) => items.map((item) => byId.get(item.id) || item));
    // Never change the frozen request while its acceptance is being checked.
    if (!pendingOrder) {
      const updated = updateCartPrices(cartRef.current, catalog);
      if (pricesDiffer(cartRef.current, updated)) {
        setPriceNotice(true);
        setCart(updated);
      }
    }
  }, [catalog, pendingOrder]);

  useEffect(() => {
    if (!pendingOrder) return undefined;
    let stopped = false;
    let timer;
    let submit = false;
    let failures = 0;
    const check = async () => {
      try {
        const response = submit
          ? await axios.post('/api/submit-order', pendingOrder, { timeout: 45000 })
          : await axios.get('/api/order-status', { params: { orderId: pendingOrder.orderId }, timeout: 45000 });
        if (stopped) return;
        submit = false;
        failures = 0;
        if (response.data.status === 'confirmed') {
          clearPendingOrder(pendingOrder.orderId);
          setLastOrder(saveLastOrder(pendingOrder.items));
          setCart([]);
          setView('categories');
          setPendingOrder(null);
          alert(response.data.testMode
            ? 'Тестовый заказ сохранён на компьютере. В Telegram и Google Sheets ничего не отправлено.'
            : 'Мы приняли ваш заказ!');
          return;
        }
      } catch (error) {
        if (stopped) return;
        if (error.response?.status === 404) submit = true;
        else if (submit && [400, 409].includes(error.response?.status)) {
          clearPendingOrder(pendingOrder.orderId);
          setPendingOrder(null);
          setCart(pendingOrder.items);
          setView('checkout');
          refreshCatalog().catch(() => {});
          alert(error.response.data?.error || 'Проверьте заказ.');
          return;
        } else {
          failures++;
          // The result of POST may be unknown: first check the same ID, never generate another.
          submit = false;
        }
      }
      if (!stopped) timer = setTimeout(check, submit ? 100 : Math.min(30000, 5000 * (failures + 1)));
    };
    check();
    return () => { stopped = true; clearTimeout(timer); };
  }, [pendingOrder, refreshCatalog]);
  const handleSelectCategory = (categoryName) => {
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
      if (existingItem.quantity <= 1) {
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

   const handleSetCartQuantity = (productId, nextQuantity) => {
    const product = products.find((p) => p.id === productId);
    const normalizedQuantity = Number.parseFloat(nextQuantity);

    if (!Number.isFinite(normalizedQuantity)) {
      return;
    }

    if (normalizedQuantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === productId ? { ...item, quantity: normalizedQuantity } : item
        );
      }

      if (!product) {
        return prevCart;
      }

      return [...prevCart, { ...product, quantity: normalizedQuantity }];
    });
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

  const handleOrderSubmit = async (orderDetails) => {
    let current;
    try {
      current = await refreshCatalog();
      if (!current) throw new Error('Catalog unavailable');
    } catch {
      alert('Не удалось проверить актуальные цены. Заказ не отправлен. Проверьте подключение и попробуйте ещё раз.');
      return;
    }
    const refreshedCart = updateCartPrices(cartRef.current, current);
    if (!refreshedCart.length) {
      alert('Ваша корзина пуста.');
      return;
    }
    if (pricesDiffer(cart, updateCartPrices(cart, current))) {
      setCart(refreshedCart);
      setPriceNotice(true);
      alert('Цены обновились. Проверьте сумму и нажмите оформить заказ ещё раз.');
      return;
    }
    try {
      const pending = await preparePendingOrder({
        customerName: orderDetails.customerName || '', address: orderDetails.address,
        phone: orderDetails.phone, fulfillmentType: orderDetails.fulfillmentType,
        items: refreshedCart, timestamp: orderDetails.timestamp,
      });
      setPendingOrder(pending);
    } catch {
      alert('Не удалось сохранить запрос в браузере. Разрешите локальное хранение данных и повторите оформление. Заказ не отправлен.');
    }
  };

  const handleRepeatOrder = () => {
    if (lastOrder && lastOrder.length > 0) {
      const productMapById = new Map();


      
      Object.values(allProducts).forEach((items = []) => {
        items.forEach((item) => {
          productMapById.set(item.id, item);
        });
      });


      const reconstructedCart = [];
      const missingItems = [];

      lastOrder.forEach((savedItem) => {
        const product = productMapById.get(savedItem.id);

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
        setProducts(allProducts[firstCategoryName]);
        setFilteredProducts(allProducts[firstCategoryName]);
      }
      setView('checkout');
    } else {
      alert('Предыдущий заказ отсутствует.');
    }
  };

  if (pendingOrder) return (
    <main className="app-shell order-pending">
      <section className="order-pending-card" aria-labelledby="order-pending-title">
        <div className="order-pending-loader" aria-hidden="true">
          <span className="order-pending-ring" />
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M10 19h28l-3 20H13l-3-20Z" />
            <path d="m16 19 8-11 8 11M19 26v6m10-6v6" />
          </svg>
        </div>
        <h2 id="order-pending-title" className="checkout-heading">Оформляем заказ</h2>
        <p className="order-pending-status" role="status" aria-live="polite">
          Ваш заказ обрабатывается
        </p>
      </section>
    </main>
  );

  return (
    <div className="app-shell">
      {priceNotice && <p role="status" style={{ padding: '10px', background: '#fff3cd', color: '#664d03' }}>
        Цены обновились. Проверьте сумму заказа.
      </p>}
      {process.env.NODE_ENV === 'development' && process.env.REACT_APP_LOCAL_ORDER_TEST === 'true' && (
        <div role="status" style={{ padding: '12px', background: '#fff3cd', color: '#664d03', textAlign: 'center' }}>
          Тестовый режим — заказы сохраняются только на этом компьютере. Telegram и Google Sheets отключены.
        </div>
      )}
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
            onSetQuantity={handleSetCartQuantity}
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
          onSetQuantity={handleSetCartQuantity}
          onDelete={handleDeleteFromCart}
        />
      )}
    </div>
  );
};

export default App;
