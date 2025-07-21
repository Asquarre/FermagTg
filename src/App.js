import './styles.css';

import React, { useState } from 'react';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import SearchBar from './components/SearchBar';
import axios from 'axios';

const App = () => {
  const [categories] = useState([

    { id: 5, name: 'П/ф замороженная продукция❄️' },
    { id: 6, name: 'Хлебобулочные изделия🥖' },
    { id: 7, name: 'Кондитерские изделия🧁' },
    { id: 8, name: 'Кулинария🍴' },
    


  ]);

  const [allProducts] = useState({

    'П/ф замороженная продукция❄️': [
      { id: 101, name: 'Манты с мясом', price: 1.8 },
      { id: 102, name: 'Жута нан с мясом', price: 1.8 },
      { id: 103, name: 'Булочка ачма с сыром', price: 1.8 },
      { id: 104, name: 'Сосиска в тесте 100г', price: 1.8 },
      { id: 105, name: 'Булочка ачма с шоколадом 100г', price: 1.8 },
      { id: 106, name: 'булочка с корицей 100г', price: 1.8 },
      { id: 107, name: 'Элеш с курицей', price: 1.8 },
      { id: 108, name: 'Плетенка с творогом изюмом', price: 1.8 },
      { id: 109, name: 'Булочка с маком', price: 1.8 },
      { id: 110, name: 'Учпучмак с мясом', price: 1.8 },
      { id: 111, name: 'Булочка ярославская 100г', price: 1.8 },
      { id: 112, name: 'Вареники отварные с картофелем кг', price: 1.8 },
      { id: 113, name: 'Вареники отварные с творогом кг', price: 1.8 },
      { id: 114, name: 'Булочка ачма с творогом и шпинатом', price: 1.8 },
      { id: 115, name: 'Плетенка со сгущенкой', price: 1.8 },
      { id: 116, name: 'Плетенка с маком', price: 1.8 },
      { id: 117, name: 'Сосиска по-баварски', price: 1.8 },
      { id: 118, name: 'Мини-пицца 130г', price: 1.8 },
      { id: 119, name: 'Лепешка с сыром 130г', price: 1.8 },
      { id: 120, name: 'Калач смит турецкий', price: 1.8 },
      { id: 121, name: 'Булочка поача с сыром 100г', price: 1.8 },

      { id: 122, name: 'Булочка поача с картошкой 100г', price: 1.8 },
      { id: 123, name: 'Пирожки печеные с яйцом-луком 100г', price: 1.8 },
      { id: 124, name: 'Пирожки печеные с картошкой 100г', price: 1.8 },
      { id: 125, name: 'Пирожки печеные с капустой 100г', price: 1.8 },
      { id: 126, name: 'Пирог с курицей и картошкой кг', price: 1.8 },
      { id: 127, name: 'Пирог с мясом и картошкой кг', price: 1.8 },
      { id: 128, name: 'Плачинада с курицей 150г', price: 1.8 },
      { id: 129, name: 'Плачинада с мясом 150г', price: 1.8 },
      { id: 130, name: 'Плюшка с яблоком 120г', price: 1.8 },
      { id: 131, name: 'Самса с тыквой', price: 1.8 },
      { id: 132, name: 'Самса с картофелем', price: 1.8 },
      { id: 133, name: 'Самса большая с курицей', price: 1.8 },
      { id: 134, name: 'Самса большая с мясом', price: 1.8 },
      { id: 135, name: 'Самса большая с сыром', price: 1.8 },
      { id: 136, name: 'Самса Микс', price: 1.8 },
      { id: 137, name: 'Самса уйгурская с мясом', price: 1.8 },
      { id: 138, name: 'Самса шашлык филе', price: 1.8 },
      { id: 139, name: 'Слойка с сыром 100г', price: 1.8 },
      { id: 140, name: 'Слойка с яблоком 120г', price: 1.8 },
      { id: 141, name: 'Тесто для баурсаков кг', price: 1.8 },
      { id: 142, name: 'Тесто слоеное классическое кг', price: 1.8 },
    ],
    'Хлебобулочные изделия🥖': [
      { id: 1801, name: 'Булочка ачма с сыром', price: 1.8 },
      { id: 1802, name: 'Булочка ачма с шоколадом', price: 1.2 },
      { id: 1803, name: 'Булочка поача с картошкой', price: 2.0 },
      { id: 1804, name: 'Булочка поача с сыром', price: 1.8 },
      { id: 1805, name: 'Булочка поача с фаршем', price: 1.2 },
      { id: 1806, name: 'Круассан с сыром', price: 2.0 },
      { id: 1807, name: 'Круассан с шоколадом', price: 1.8 },
      { id: 1808, name: 'Круассан со сгущенкой', price: 1.2 },
      { id: 1809, name: 'Плачинда с Курицей', price: 1.8 },
      { id: 1810, name: 'Плачинда с Мясом', price: 1.2 },
      { id: 1811, name: 'Слойка с сыром', price: 2.0 },
      { id: 1812, name: 'Слойка с яблоком', price: 1.8 },
      { id: 1813, name: 'Сосиска в тесте', price: 1.2 },
      { id: 1814, name: 'Сосиска в тесте детская', price: 2.0 },
      { id: 1815, name: 'Баурсаки', price: 1.8 },
      { id: 1816, name: 'Булочка Бротчин', price: 1.2 },
      { id: 1817, name: 'Булочка для Гамбургера', price: 1.2 },
      { id: 1818, name: 'Булочка для Хот-Дога', price: 1.8 },
      { id: 1819, name: 'Булочка плетенка с маком', price: 1.2 },
      { id: 1820, name: 'Булочка с изюмом', price: 2.0 },
      { id: 1821, name: 'Булочка с корицей', price: 1.8 },
      { id: 1822, name: 'Булочка с маком', price: 1.2 },
      { id: 1823, name: 'Булочка с повидлом', price: 2.0 },
      { id: 1824, name: 'Булочка сдобная', price: 1.8 },
      { id: 1825, name: 'Булочка сердечко', price: 1.2 },
      { id: 1826, name: 'Булочка со сгущенкой', price: 1.8 },
      { id: 1827, name: 'Булочка ярославская', price: 1.2 },
      { id: 1828, name: 'Галета', price: 2.0 },
      { id: 1829, name: 'Калач смит турецкий', price: 1.8 },
      { id: 1830, name: 'Мини пицца', price: 1.2 },
      { id: 1831, name: 'Пиде с сыром', price: 2.0 },
      { id: 1832, name: 'Пиде с фаршем', price: 1.8 },
      { id: 1833, name: 'Пирожки жареные с картошкой', price: 1.2 },
      { id: 1834, name: 'Пирожки жареные с капустой', price: 1.2 },
      { id: 1835, name: 'Пирожки жареные с луком/яйцом', price: 2.0 },
      { id: 1836, name: 'Сочник с творогом', price: 1.8 },
      { id: 1837, name: 'Сырные шарики', price: 1.2 },
      { id: 1838, name: 'Учпучмак с мясом/картофелем', price: 2.0 },
      { id: 1839, name: 'Чебурек жареный с мясом', price: 1.8 },
      { id: 1840, name: 'Чебурек жареный с мясом и жусаем', price: 1.2 },
      { id: 1841, name: 'Элеш с курицей', price: 1.2 },
    ],
    'Кулинария🍴': [
      { id: 2201, name: 'Самса большая с курицей', price: 1.8 },
      { id: 2202, name: 'Самса большая с мясом', price: 1.2 },
      { id: 2203, name: 'Самса большая с сыром', price: 2.0 },
      { id: 2204, name: 'Самса микс', price: 1.8 },
      { id: 2205, name: 'Самса мини с мясом', price: 1.8 },
      { id: 2206, name: 'Самса уйгурская с мясом', price: 1.2 },
      { id: 2207, name: 'Самса шашлык филе', price: 2.0 },
    ],
    'Кондитерские изделия🧁': [
      { id: 2401, name: 'Багет', price: 1.8 },
      { id: 2402, name: 'Багет живая рожь', price: 1.2 },
      { id: 2403, name: 'Батон молочный с кунжутом', price: 2.0 },
      { id: 2404, name: 'Батон нарезной (В нарезке)', price: 1.8 },
      { id: 2405, name: 'Батон нарезной', price: 1.8 },
      { id: 2406, name: 'Батон отрубной (В нарезке)', price: 1.2 },
      { id: 2407, name: 'Батон отрубной', price: 2.0 },
      { id: 2408, name: 'Батон турецкий', price: 1.8 },
      { id: 2409, name: 'Лаваш', price: 1.2 },
      { id: 2410, name: 'Лепешка с сыром', price: 2.0 },
      { id: 2411, name: 'Сухари', price: 1.8 },
      { id: 2412, name: 'Хлеб бездрожжевой ремесленный', price: 1.8 },
      { id: 2413, name: 'Хлеб домашний', price: 1.2 },
      { id: 2414, name: 'Хлеб крестьянский на сыворотке', price: 2.0 },
      { id: 2415, name: 'Хлеб кукурузный (В нарезке)', price: 1.2 },
      { id: 2416, name: 'Хлеб кукурузный', price: 2.0 },
      { id: 2417, name: 'Хлеб посольский', price: 1.8 },
      { id: 2418, name: 'Хлеб президентский', price: 1.8 },
      { id: 2419, name: 'Хлеб ржаной', price: 1.2 },
      { id: 2420, name: 'Хлеб ржаной немецкий', price: 2.0 },
      { id: 2421, name: 'Хлеб ромашка с кунжутом', price: 2.0 },
      { id: 2422, name: 'Хлеб тостовой', price: 2.0 },
      { id: 2423, name: 'Хлеб чесночный', price: 2.0 },
    ],

  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('categories'); // 'categories', 'products', 'checkout'

  const handleSelectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    setProducts(allProducts[categoryName]);
    setFilteredProducts(allProducts[categoryName]);
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
    setView('checkout');
  };

  const handleOrderSubmit = (orderDetails) => {
    axios
      .post('/api/submit-order', {
        user_id: orderDetails.user_id || '', // Include user_id
        address: orderDetails.address,
        phone: orderDetails.phone,
        items: cart,
        timestamp: orderDetails.timestamp,
      })
      .then(() => {
        alert('Мы приняли ваш заказ!');
        setCart([]);
        setView('categories');
      })
      .catch(() => {
        alert('Ошибка!');
      });
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="/Logo.png"
          alt="Grocery Store Logo"
          style={{ width: '150px', height: '150px' }}
        />
        <h1></h1>
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
            onBack={() => setView('categories')}
            onCheckout={handleCheckout} // Pass handleCheckout here
            cart={cart}
          />
          <div className="shopping-cart">
            <h3>корзина</h3>
            {cart.length > 0 ? (
              <ul>
                {cart.map((item) => (
                  <li key={item.id}>
                    {item.name} - {item.quantity} x ${item.price.toFixed(2)} = $
                    {(item.quantity * item.price).toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ваша Корзина Пуста.</p>
            )}
            {cart.length > 0 && (
              <div className="total">
                Сумма Заказа: $
                {cart
                  .reduce((acc, item) => acc + item.quantity * item.price, 0)
                  .toFixed(2)}
              </div>
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
        />
      )}
    </div>
  );
};

export default App;
