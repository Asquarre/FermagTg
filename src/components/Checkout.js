
import React, { useState, useRef } from 'react';

const Checkout = ({ onSubmit, cart, onBack }) => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  // Keep track of the *raw* digits from the last change
  const lastRaw = useRef('');

  // Format a string of digits into "+8(XXX)-XXX-XXXX"
  const formatPhoneNumber = (digits) => {
    let formatted = '+8';
    // digits already stripped of non-digits, but drop any leading 8 we added
    let d = digits.startsWith('8') ? digits.slice(1) : digits;

    if (d.length > 0) {
      formatted += '(' + d.slice(0, 3);
    }
    if (d.length >= 3) {
      formatted += ')-' + d.slice(3, 6);
    }
    if (d.length >= 6) {
      formatted += '-' + d.slice(6, 10);
    }
    return formatted;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // strip out everything but digits
    const raw = value.replace(/\D/g, '');

    // if the new raw is shorter than before, user is deleting:
    if (raw.length < lastRaw.current.length) {
      // just let them delete through the formatted string
      setPhone(value);
      lastRaw.current = raw;
    } else {
      // user is adding digits: apply formatting
      const formatted = formatPhoneNumber(raw);
      setPhone(formatted);
      lastRaw.current = raw;
    }
  };

  const handleSubmit = () => {
    if (!address || !phone) {
      alert('Please fill in all fields.');
      return;
    }
    // require at least 11 digits (8 + 10 more) before allowing submit
    const digitCount = phone.replace(/\D/g, '').length;
    if (digitCount < 11) {
      alert('Please enter a complete phone number.');
      return;
    }
    onSubmit({
      address,
      phone,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div>
      {/* Back Button */}
      <button className="go-back-button" onClick={onBack}>
        &larr; Назад
      </button>

      <h2>Корзина</h2>

      {/* Order Summary */}
      <div className="checkout-order-summary">
        <h3>Ваш Заказ:</h3>
        {cart.length > 0 ? (
          <ul>
            {cart.map((item) => (
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

      {/* Address Input */}
      <div style={{ marginBottom: '10px' }}>
        <label>Адрес:</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows="3"
          placeholder="Введите адрес доставки"
          className="input-box"
        />
      </div>

      {/* Phone Input */}
      <div style={{ marginBottom: '20px' }}>
        <label>Номер:</label>
        <input
          type="text"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="+8(XXX)-XXX-XXXX"
          className="input-box"
        />
      </div>

      {/* Submit Order Button */}
      <button className="submit-order-button" onClick={handleSubmit}>
        Заказать
      </button>
    </div>
  );
};

export default Checkout;
