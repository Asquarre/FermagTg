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
    { id: 1, name: 'Fruits' },
    { id: 2, name: 'Vegetables' },
    { id: 3, name: 'Dairy' },
    { id: 4, name: 'Bakery' },
    { id: 5, name: 'Блины' },
    { id: 6, name: 'Блюда из мяса' },
    { id: 7, name: 'Блюда из птицы' },
    { id: 8, name: 'Блюда из рыбы' },
    { id: 9, name: 'Блюда из теста' },
    { id: 10, name: 'Готовые гарниры' },
    { id: 11, name: 'Готовые завтраки' },
    { id: 12, name: 'Готовые обеды' },
    { id: 13, name: 'Готовые салаты' },
    { id: 14, name: 'Готовые супы' },
    { id: 15, name: 'Изделия из слоеного теста' },
    { id: 16, name: 'Кондитерские изделия' },
    { id: 17, name: 'Кулинария' },
    { id: 18, name: 'Хлебобулочные изделия' },
    { id: 19, name: 'Пахлава' },
    { id: 20, name: 'Печенье' },
    { id: 21, name: 'Пироги' },
    { id: 22, name: 'Самса' },
    { id: 23, name: 'Тесто П/Ф' },
    { id: 24, name: 'Хлеб/Лепешка/Сухари' },


  ]);

  const [allProducts] = useState({
    Fruits: [
      { id: 101, name: 'Apple', price: 1.2 },
      { id: 102, name: 'Banana', price: 0.8 },
      { id: 103, name: 'Orange', price: 1.0 },
    ],
    Vegetables: [
      { id: 201, name: 'Carrot', price: 0.5 },
      { id: 202, name: 'Broccoli', price: 1.0 },
      { id: 203, name: 'Spinach', price: 0.7 },
    ],
    Dairy: [
      { id: 301, name: 'Milk', price: 2.5 },
      { id: 302, name: 'Cheese', price: 3.0 },
      { id: 303, name: 'Yogurt', price: 1.5 },
    ],
    Bakery: [
      { id: 401, name: 'Bread', price: 1.8 },
      { id: 402, name: 'Bagel', price: 1.2 },
      { id: 403, name: 'Croissant', price: 2.0 },
    ],
    Блины: [
      { id: 501, name: 'Блины (кг)', price: 1.8 },
    ],
    'Блюда из мяса': [
      { id: 601, name: 'Гуляш из говядины', price: 1.8 },
      { id: 602, name: 'Мясо по тайски', price: 1.2 },
      { id: 603, name: 'Тефтели под соусом', price: 2.0 },
    ],
    'Блюда из птицы': [
      { id: 701, name: 'Бедрышки запеченные', price: 1.8 },
      { id: 702, name: 'Бефстроганов из курицы', price: 1.2 },
      { id: 703, name: 'Голень запеченная', price: 2.0 },
      { id: 704, name: 'Котлета куринная жастар', price: 1.8 },
      { id: 705, name: 'Котлета куринная наурыз', price: 1.2 },
      { id: 706, name: 'Крылышки жареные', price: 2.0 },
      { id: 707, name: 'Курица тереяки', price: 1.8 },
      { id: 708, name: 'Наггетсы', price: 1.2 },
      { id: 709, name: 'Окорочок', price: 2.0 },
      { id: 710, name: 'Филе куриное с овощами', price: 1.2 },
      { id: 711, name: 'Шашлык из филе куриного', price: 2.0 },
    ],
    'Блюда из рыбы': [
      { id: 801, name: 'Минтай жареный', price: 1.8 },
      { id: 802, name: 'Судак жареный', price: 1.2 },
    ],
    'Блюда из теста': [
      { id: 901, name: 'Вареники отварные (картофель)', price: 1.8 },
      { id: 902, name: 'Вареники отварные (творог)', price: 1.2 },
      { id: 903, name: 'Жута нан (Мясо и Тыква)', price: 2.0 },
      { id: 904, name: 'Жута нан (Мясо)', price: 1.8 },
      { id: 905, name: 'Манты с мясом', price: 1.2 },
      { id: 906, name: 'Сигара Борек (Картофель)', price: 2.0 },
    ],
    'Готовые гарниры': [
      { id: 1001, name: 'Гречка отварная ', price: 1.8 },
      { id: 1002, name: 'Капуста тушеная', price: 1.2 },
      { id: 1003, name: 'Картофель отварной', price: 2.0 },
      { id: 1004, name: 'Картошка жареная', price: 1.8 },
      { id: 1005, name: 'Пюре картофельное', price: 1.2 },
      { id: 1006, name: 'Рис отварной', price: 2.0 },
      { id: 1007, name: 'Рис цветной', price: 1.8 },
      { id: 1008, name: 'Фри', price: 1.2 },
    ],
    'Готовые завтраки': [
      { id: 1101, name: 'Каша геркулесовая ', price: 1.8 },
      { id: 1102, name: 'Каша манная', price: 1.2 },
      { id: 1103, name: 'Каша рисовая с тыквой', price: 2.0 },
      { id: 1104, name: 'Сырники', price: 1.8 },
      { id: 1105, name: 'Яичница с сосиской', price: 1.2 },
      { id: 1106, name: 'Рис отварной', price: 2.0 },
      { id: 1107, name: 'Рис цветной', price: 1.8 },
      { id: 1108, name: 'Фри', price: 1.2 },
    ],
    'Готовые обеды': [
      { id: 1201, name: 'Бедро в маринаде с гречкой ', price: 1.8 },
      { id: 1202, name: 'Бефстроганов из курицы с гречкой', price: 1.2 },
      { id: 1203, name: 'Бефстроганов из курицы с рисом', price: 2.0 },
      { id: 1204, name: 'Гуляш из говядиныс пюре', price: 1.8 },
      { id: 1205, name: 'Котлета жастар куриная', price: 1.2 },
      { id: 1206, name: 'Котлета из говядины с макаронами', price: 2.0 },
      { id: 1207, name: 'Котлета из говядины с пюре', price: 1.8 },
      { id: 1208, name: 'Котлета наурыз куриная с рисом', price: 1.2 },
      { id: 1209, name: 'Курица терияки с рисом ', price: 1.8 },
      { id: 1210, name: 'Маринованые крылышки с рисом', price: 1.2 },
      { id: 1211, name: 'Мясо по тайски с рисом', price: 2.0 },
      { id: 1212, name: 'Наггетсы с гречкой', price: 1.8 },
      { id: 1213, name: 'Наггетсы с пюре', price: 1.2 },
      { id: 1214, name: 'Судак с цветным рисом', price: 2.0 },
      { id: 1215, name: 'Тефтели в соусе с пюре', price: 1.8 },
      { id: 1216, name: 'Тефтели говяжьи с макаронами', price: 1.2 },
      { id: 1216, name: 'Филе с овощами с цветным рисом', price: 1.2 },
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
        alert('Order submitted successfully!');
        setCart([]);
        setView('categories');
      })
      .catch(() => {
        alert('There was an error submitting your order.');
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
            <h3>Shopping Cart</h3>
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
              <p>Your cart is empty.</p>
            )}
            {cart.length > 0 && (
              <div className="total">
                Total: $
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
