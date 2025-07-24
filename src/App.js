import './styles.css';

import React, { useState, useEffect } from 'react';
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
    { id: 7, name: 'Кондитерские изделия🧁\n/Кулинария🍴' },
    


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
      { id: 2401, name: 'Багет 300г', price: 1.8 },
      { id: 2402, name: 'Батон Турецкий 250г', price: 1.2 },
      { id: 2403, name: 'Багет живая рожь 300г', price: 2.0 },
      { id: 2404, name: 'Батон молочный с кунжутом (В нарезке) 300г', price: 1.8 },
      { id: 2405, name: 'Батон нарезной (В нарезке) 300г', price: 1.8 },
      { id: 2406, name: 'Батон отрубной (В нарезке) 300г', price: 1.2 },
      { id: 2407, name: 'Булочка бротчин 6шт', price: 2.0 },
      { id: 2408, name: 'Булочка для гамбургера 3 шт', price: 1.8 },
      { id: 2409, name: 'Булочка для хот-дога 3шт', price: 1.2 },
      { id: 2410, name: 'Булочка сдобная кг', price: 2.0 },
      { id: 2411, name: 'Лаваш 2шт', price: 1.8 },
      { id: 2412, name: 'Лепешка Ташкентская 400г', price: 1.8 },
      { id: 2413, name: 'Сухари кг', price: 1.2 },
      { id: 2414, name: 'Сырные шарики кг', price: 2.0 },
      { id: 2415, name: 'Хлеб бездрожжевой ремесленный 320г', price: 1.2 },
      { id: 2416, name: 'Хлеб домашний 300г', price: 2.0 },
      { id: 2417, name: 'Хлеб сайка 400г', price: 1.8 },
      { id: 2418, name: 'Хлеб зимний 250г', price: 1.8 },
      { id: 2419, name: 'Хлеб домашний 460г', price: 1.2 },
      { id: 2420, name: 'Хлеб кукурузный (В нарезке) 350г', price: 2.0 },
      { id: 2421, name: 'Хлеб кукурузный 350г', price: 2.0 },
      { id: 2422, name: 'Хлеб посольский 400г', price: 2.0 },
      { id: 2423, name: 'Хлеб Президентский (В нарезке) 300г', price: 2.0 },

      { id: 2424, name: 'Хлеб Президентский 300г', price: 2.0 },
      { id: 2425, name: 'Хлеб ржаной 500г', price: 2.0 },
      { id: 2426, name: 'Хлеб ржаной немецкий 400г', price: 2.0 },
      { id: 2427, name: 'Хлеб ромашка с кунжутом 300г', price: 2.0 },

      { id: 2428, name: 'Хлеб тостовой 300г', price: 2.0 },
      { id: 2429, name: 'Хлеб чесночный 200г', price: 2.0 },
      { id: 2430, name: 'Хлебцы злаковые П/П кг', price: 2.0 },
    ],

    'Кондитерские изделия🧁\n/Кулинария🍴': [
      { id: 1801, name: 'Баурсаки кг', price: 1.8 },
      { id: 1802, name: 'Безе цветное кг', price: 1.2 },
      { id: 1803, name: 'Безе с шоколадом кг', price: 2.0 },
      { id: 1804, name: 'Вафельные трубочки кг', price: 1.8 },
      { id: 1805, name: 'Галета кг', price: 1.2 },
      { id: 1806, name: 'Кольца творожные кг', price: 2.0 },
      { id: 1807, name: 'Кекс творожный свежая ягода 200г', price: 1.8 },
      { id: 1808, name: 'Корзинка творожная с ягодой 150г', price: 1.2 },
      { id: 1809, name: 'Круассан с колбасой 150г', price: 1.8 },
      { id: 1810, name: 'Круассан с курицей 150г', price: 1.2 },
      { id: 1811, name: 'Сендвич с колбасой', price: 2.0 },
      { id: 1812, name: 'Сендвич с курицей', price: 1.8 },
      { id: 1813, name: 'Лапша домашняя яичная кг', price: 1.2 },
      { id: 1814, name: 'Пирожок жареный с картошкой', price: 2.0 },
      { id: 1815, name: 'Пирожок жареный с капустой', price: 1.8 },
      { id: 1816, name: 'орешки кг', price: 1.2 },
      { id: 1817, name: 'Чебурек жареный с мясом 130г', price: 1.2 },
      { id: 1818, name: 'Запеканка творожная со смородиной кг', price: 1.8 },
      { id: 1819, name: 'Печенье американо кг', price: 1.2 },
      { id: 1820, name: 'Печенье бисконти кг', price: 2.0 },
      { id: 1821, name: 'Печенье домашнее творожное кг', price: 1.8 },
      { id: 1822, name: 'Трайфл кг', price: 1.2 },
      { id: 1823, name: 'Печенье куки кг', price: 2.0 },
      { id: 1824, name: 'Печенье курабье кг', price: 1.8 },
      { id: 1825, name: 'Пирог восточный кг', price: 1.2 },
      { id: 1826, name: 'Печенье тартус кг', price: 1.8 },
      { id: 1827, name: 'Пирог творожный с ягодами кг', price: 1.2 },
      { id: 1828, name: 'Профитроли со взбитыми сливками и кремом чиз кг', price: 2.0 },
      { id: 1829, name: 'Сочник с творогом 120г', price: 1.8 },
      { id: 1830, name: 'Паста зеленая кг', price: 1.2 },
      { id: 1831, name: 'Спагетти по-домашнему кг', price: 2.0 },
      { id: 1832, name: 'Торт рыжик кг', price: 1.8 },
      { id: 1833, name: 'Торт пыжик кг', price: 1.2 },
      { id: 1834, name: 'Эклеры с кремом и сгущенкой 120г', price: 1.2 },
      { id: 1835, name: 'Торт чижик кг', price: 2.0 },
      { id: 1836, name: 'Торт киевский кг', price: 1.8 },
      { id: 1837, name: 'Торт черный лес кг', price: 1.2 },
      { id: 1838, name: 'Чак-Чак кг', price: 2.0 },
      { id: 1839, name: 'Хворост кг', price: 1.8 },
      { id: 2201, name: 'Заправка для окрошки 300г', price: 1.8 },
      { id: 2202, name: 'Набор для окрошки с мясом кг', price: 1.2 },
      { id: 2203, name: 'Набор для окрошки с колбасой кг', price: 2.0 },
      { id: 2210, name: 'Капуста квашеная кг', price: 1.2 },
    ],
    
  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  const [view, setView] = useState('categories'); // 'categories', 'products', 'checkout'

   useEffect(() => {
    const saved = localStorage.getItem('lastOrder');
    if (saved) {
      try {
        setLastOrder(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved order', e);
      }
    }
  }, []);

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
    if (cart.length === 0) {
      alert('Ваша корзина пуста.');
      return;
    }
    setView('checkout');
  };

  const handleOrderSubmit = (orderDetails) => {
    return axios
      .post('/api/submit-order', {
        user_id: orderDetails.user_id || '', // Include user_id
        address: orderDetails.address,
        phone: orderDetails.phone,
        items: cart,
        timestamp: orderDetails.timestamp,
      })
      .then(() => {
        alert('Мы приняли ваш заказ!');
        localStorage.setItem('lastOrder', JSON.stringify(cart));
        setLastOrder(cart);
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
      setCart(lastOrder);
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
    <div style={{ padding: '20px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'space-between',
        }}
      >
        <img
          src="/Logo.png"
          alt="Grocery Store Logo"
          style={{ width: '150px', height: '150px' }}
        />
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
                    {item.name} - {item.quantity} x ₸{item.price.toFixed(2)} = ₸
                    {(item.quantity * item.price).toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ваша Корзина Пуста.</p>
            )}
            {cart.length > 0 && (
              <div className="total">
                Сумма Заказа: ₸
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
