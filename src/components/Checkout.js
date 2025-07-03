
// src/components/Checkout.js

import React, { useState } from 'react';

const Checkout = ({ onSubmit, cart, onBack }) => {
  const [address, setAddress] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);

  // Only digits, up to 11 total (leading 8 + up to 10 more)
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    setRawPhone(digits);
  };

  const handlePhoneFocus = () => {
    setEditingPhone(true);
  };
  const handlePhoneBlur = () => {
    setEditingPhone(false);
  };

  // Format on blur
  const formatPhoneNumber = (digits) => {
    if (!digits) return '';
    let d = digits;
    // Ensure leading 8
    if (!d.startsWith('8')) d = '8' + d;
    // remove any extras
    const core = d.slice(1); // drop the leading 8 for grouping
    let formatted = '+8';
    if (core.length > 0) {
      formatted += '(' + core.slice(0, 3);
    }
    if (core.length >= 3) {
      formatted += ')-' + core.slice(3, 6);
    }
    if (core.length >= 6) {
      formatted += '-' + core.slice(6, 10);
    }
    return formatted;
  };

  const displayedPhone = editingPhone
    ? rawPhone
    : formatPhoneNumber(rawPhone);

  const handleSubmit = () => {
    if (!address.trim() || rawPhone.length < 11) {
      alert('Пожалуйста, введите адрес и полный номер телефона.');
      return;
    }
    onSubmit({
      address: address.trim(),
      phone: formatPhoneNumber(rawPhone),
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div>
      <button className="go-back-button" onClick={onBack}>
        &larr; Назад
      </button>

      <h2>Корзина</h2>
      <div className="checkout-order-summary">
        <h3>Ваш заказ:</h3>
        {cart.length ? (
          <ul>
            {cart.map(item => (
              <li key={item.id}>
                {item.name} — {item.quantity} × ${item.price.toFixed(2)} = $
                {(item.quantity * item.price).toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <p>Ваша корзина пуста.</p>
        )}
      </div>

      <div style={{ margin: '10px 0' }}>
        <label>Адрес:</label>
        <textarea
          className="input-box"
          rows="3"
          placeholder="Введите адрес доставки"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      <div style={{ margin: '10px 0' }}>
        <label>Номер:</label>
        <input
          className="input-box"
          type="text"
          placeholder="+8(XXX)-XXX-XXXX"
          value={displayedPhone}
          onChange={handlePhoneChange}
          onFocus={handlePhoneFocus}
          onBlur={handlePhoneBlur}
        />
      </div>

      <button className="submit-order-button" onClick={handleSubmit}>
        Заказать
      </button>
    </div>
  );
};

export default Checkout;
