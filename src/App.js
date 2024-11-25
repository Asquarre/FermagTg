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
  ]);

  const [allProducts] = useState({
    Fruits: [
      { id: 101, name: 'Apple', unit: 'kg' },
      { id: 102, name: 'Banana', unit: 'kg' },
      { id: 103, name: 'Orange', unit: 'kg' },
    ],
    Vegetables: [
      { id: 201, name: 'Carrot', unit: 'kg' },
      { id: 202, name: 'Broccoli', unit: 'kg'},
      { id: 203, name: 'Spinach', unit: 'kg'},
    ],
    Dairy: [
      { id: 301, name: 'Milk', unit: 'kg'},
      { id: 302, name: 'Cheese', unit: 'kg' },
      { id: 303, name: 'Yogurt', unit: 'kg'},
    ],
    Bakery: [
      { id: 401, name: 'Bread', unit: 'pcs' },
      { id: 402, name: 'Bagel', unit: 'pcs' },
      { id: 403, name: 'Croissant', unit: 'pcs' },
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
  
    const increment = product.unit === 'kg' ? 0.1 : 1; // Adjust increment based on unit
  
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: parseFloat((item.quantity + increment).toFixed(2)) }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: increment }]);
    }
  };
  

  const handleRemoveFromCart = (productId) => {
    const product = products.find((p) => p.id === productId);
    const existingItem = cart.find((item) => item.id === productId);
  
    if (existingItem) {
      const decrement = product.unit === 'kg' ? 0.1 : 1; // Adjust decrement based on unit
      const newQuantity = parseFloat((existingItem.quantity - decrement).toFixed(2));
  
      if (newQuantity <= 0) {
        setCart(cart.filter((item) => item.id !== productId));
      } else {
        setCart(
          cart.map((item) =>
            item.id === productId
              ? { ...item, quantity: newQuantity }
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
