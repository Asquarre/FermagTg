// src/components/Cart.js
import React from 'react';
import AnimatedNumber from './AnimatedNumber';
import { formatPrice } from '../utils';

const Cart = ({ cartItems }) => {
  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div>
      <h2>Корзина</h2>
      {cartItems.length === 0 ? (
        <p>Ваша корзина пуста.</p>
      ) : (
        <>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {cartItems.map((item) => (
              <li key={item.id} style={{ marginBottom: '10px' }}>
                {item.name} - <AnimatedNumber value={item.quantity} /> x ₸
                {formatPrice(item.price)} = ₸
                <AnimatedNumber value={formatPrice(item.price * item.quantity)} />
              </li>
            ))}
          </ul>
                    <h3>
            Total: ₸<AnimatedNumber value={formatPrice(total)} />
          </h3>
        </>
      )}
    </div>
  );
};

export default Cart;
