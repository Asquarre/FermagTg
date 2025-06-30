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

    { id: 5, name: 'Блины🥞' },
    { id: 6, name: 'Блюда из мяса🥩' },
    { id: 7, name: 'Блюда из птицы🍗' },
    { id: 8, name: 'Блюда из рыбы🐟' },
    { id: 9, name: 'Блюда из теста🥟' },
    { id: 10, name: 'Готовые гарниры🍚' },
    { id: 11, name: 'Готовые завтраки🍳' },
    { id: 12, name: 'Готовые обеды🍽️' },
    { id: 13, name: 'Готовые салаты🥗' },
    { id: 14, name: 'Готовые супы🍜' },
    { id: 15, name: 'Изделия из слоеного теста🥐' },
    { id: 16, name: 'Кондитерские изделия🧁' },
    { id: 17, name: 'Кулинария🍴' },
    { id: 18, name: 'Хлебобулочные изделия🥯' },
    { id: 19, name: 'Пахлава🇹🇷' },
    { id: 20, name: 'Печенье🍪' },
    { id: 21, name: 'Пироги🥧' },
    { id: 22, name: 'Самса🥠' },
    { id: 23, name: 'Тесто П/Ф🌾' },
    { id: 24, name: 'Хлеб/Лепешка/Сухари🥖' },


  ]);

  const [allProducts] = useState({

    'Блины🥞': [
      { id: 501, name: 'Блины (кг)', price: 1.8 },
    ],
    'Блюда из мяса🥩': [
      { id: 601, name: 'Гуляш из говядины', price: 1.8 },
      { id: 602, name: 'Мясо по тайски', price: 1.2 },
      { id: 603, name: 'Тефтели под соусом', price: 2.0 },
    ],
    'Блюда из птицы🍗': [
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
    'Блюда из рыбы🐟': [
      { id: 801, name: 'Минтай жареный', price: 1.8 },
      { id: 802, name: 'Судак жареный', price: 1.2 },
    ],
    'Блюда из теста🥟': [
      { id: 901, name: 'Вареники отварные (картофель)', price: 1.8 },
      { id: 902, name: 'Вареники отварные (творог)', price: 1.2 },
      { id: 903, name: 'Жута нан (Мясо и Тыква)', price: 2.0 },
      { id: 904, name: 'Жута нан (Мясо)', price: 1.8 },
      { id: 905, name: 'Манты с мясом', price: 1.2 },
      { id: 906, name: 'Сигара Борек (Картофель)', price: 2.0 },
    ],
    'Готовые гарниры🍚': [
      { id: 1001, name: 'Гречка отварная ', price: 1.8 },
      { id: 1002, name: 'Капуста тушеная', price: 1.2 },
      { id: 1003, name: 'Картофель отварной', price: 2.0 },
      { id: 1004, name: 'Картошка жареная', price: 1.8 },
      { id: 1005, name: 'Пюре картофельное', price: 1.2 },
      { id: 1006, name: 'Рис отварной', price: 2.0 },
      { id: 1007, name: 'Рис цветной', price: 1.8 },
      { id: 1008, name: 'Фри', price: 1.2 },
    ],
    'Готовые завтраки🍳': [
      { id: 1101, name: 'Каша геркулесовая ', price: 1.8 },
      { id: 1102, name: 'Каша манная', price: 1.2 },
      { id: 1103, name: 'Каша рисовая с тыквой', price: 2.0 },
      { id: 1104, name: 'Сырники', price: 1.8 },
      { id: 1105, name: 'Яичница с сосиской', price: 1.2 },
      { id: 1106, name: 'Рис отварной', price: 2.0 },
      { id: 1107, name: 'Рис цветной', price: 1.8 },
      { id: 1108, name: 'Фри', price: 1.2 },
    ],
    'Готовые обеды🍽️': [
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
      { id: 1217, name: 'Филе с овощами с цветным рисом', price: 1.2 },
    ],
    'Готовые салаты🥗': [
      { id: 1301, name: 'Капуста квашеная  ', price: 1.8 },
      { id: 1302, name: 'Салат крабик', price: 1.2 },
      { id: 1303, name: 'Салат морковь по корейски', price: 2.0 },
      { id: 1304, name: 'Салат оливье', price: 1.8 },
      { id: 1305, name: 'Салат сельдь под шубой', price: 1.2 },
      { id: 1306, name: 'Салат цезарь', price: 2.0 },
    ],
    'Готовые супы🍜': [
      { id: 1401, name: 'Борщ со сметаной', price: 1.8 },
      { id: 1402, name: 'Кукси', price: 1.2 },
      { id: 1403, name: 'Суп Рамен', price: 2.0 },
      { id: 1404, name: 'Суп Харчо', price: 1.8 },
      { id: 1405, name: 'Суп чечевичный', price: 1.2 },
      { id: 1406, name: 'Салат цезарь', price: 2.0 },
    ],
    'Изделия из слоеного теста🥐': [
      { id: 1501, name: 'Круассан классический', price: 1.8 },
      { id: 1502, name: 'Круассан с колбасой', price: 1.2 },
      { id: 1503, name: 'Круассан с курицей', price: 2.0 },
    ],

    'Кондитерские изделия🧁': [
      { id: 1601, name: 'Вафельные трубочки ', price: 1.8 },
      { id: 1602, name: 'Кекс творожный свежая ягода', price: 1.2 },
      { id: 1603, name: 'Коржик с творогом', price: 2.0 },
      { id: 1604, name: 'Корзинка творожная с ягодой', price: 1.8 },
      { id: 1605, name: 'Маффин йогуртный с ягодами', price: 1.2 },
      { id: 1606, name: 'Маффин шоколадный', price: 2.0 },
      { id: 1607, name: 'Орешки', price: 1.8 },
      { id: 1608, name: 'Пирожки печенья с картошкой', price: 1.2 },
      { id: 1609, name: 'Профитроли со взбитыми сливками и кремом ', price: 1.8 },
      { id: 1610, name: 'Фермаг хворост', price: 1.2 },
      { id: 1611, name: 'Фермаг чак-чак', price: 2.0 },
    ],

    'Кулинария🍴': [
      { id: 1701, name: 'Запеканка картофельная ', price: 1.8 },
      { id: 1702, name: 'Лагман жареный', price: 1.2 },
      { id: 1703, name: 'Плов из говядины', price: 2.0 },
      { id: 1704, name: 'Сэндвич с колбасой', price: 1.8 },
      { id: 1705, name: 'Сэндвич с курицей', price: 1.2 },
    ],
    'Хлебобулочные изделия🥯': [
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
      { id: 1834, name: 'Элеш с курицей', price: 1.2 },
    ],
    'Пахлава🇹🇷': [
      { id: 1901, name: 'Пахлава Азербайджанская', price: 1.8 },
      { id: 1902, name: 'Пахлава луковица', price: 1.2 },
      { id: 1903, name: 'Пахлава фисташковая', price: 2.0 },
      { id: 1904, name: 'Пахлава шоколадная', price: 1.8 },
    ],
    'Печенье🍪': [
      { id: 2001, name: 'Безе цветное', price: 1.8 },
      { id: 2002, name: 'Печенье американо', price: 1.2 },
      { id: 2003, name: 'Печенье бисконти', price: 2.0 },
      { id: 2004, name: 'Печенье домашнее творожное', price: 1.8 },
      { id: 2005, name: 'Печенье курабье', price: 1.8 },
      { id: 2006, name: 'Печенье с печеным яблоком', price: 1.2 },
      { id: 2007, name: 'Печенье соленое', price: 2.0 },
      { id: 2008, name: 'Печенье тартус', price: 1.8 },
    ],
    'Пироги🥧': [
      { id: 2101, name: 'Пирог восточный', price: 1.8 },
      { id: 2102, name: 'Пирог с курицей и картошкой', price: 1.2 },
      { id: 2103, name: 'Пирог с мясом и картошкой', price: 2.0 },
      { id: 2104, name: 'Пирог сметанковый с ягодой', price: 1.8 },
      { id: 2105, name: 'Пирог творожно-фруктовый', price: 1.8 },
      { id: 2106, name: 'Пирог творожный с ягодами', price: 1.2 },
      { id: 2107, name: 'Пирог яблочный с корицей', price: 2.0 },
    ],
    'Самса🥠': [
      { id: 2201, name: 'Самса большая с курицей', price: 1.8 },
      { id: 2202, name: 'Самса большая с мясом', price: 1.2 },
      { id: 2203, name: 'Самса большая с сыром', price: 2.0 },
      { id: 2204, name: 'Самса микс', price: 1.8 },
      { id: 2205, name: 'Самса мини с мясом', price: 1.8 },
      { id: 2206, name: 'Самса уйгурская с мясом', price: 1.2 },
      { id: 2207, name: 'Самса шашлык филе', price: 2.0 },
    ],
    'Тесто П/Ф🌾': [
      { id: 2301, name: 'Лапша домашнаяя яичная', price: 1.8 },
      { id: 2302, name: 'Паста зеленая', price: 1.2 },
      { id: 2303, name: 'Тесто для баурсаков', price: 2.0 },
      { id: 2304, name: 'Тесто слоеное классическое', price: 1.8 },
    ],
    'Хлеб/Лепешка/Сухари🥖': [
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
      {view === 'категории' && (
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
