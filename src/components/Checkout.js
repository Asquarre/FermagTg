import React, { useState } from 'react';

const Checkout = ({ onSubmit, cart, onBack }) => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Added handlePhoneChange function
  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters

    let formattedPhone = '';

    if (input.startsWith('8')) {
      formattedPhone = '+8';
    } else {
      formattedPhone = '+8';
      input = '8' + input;
    }

    if (input.length > 1) {
      formattedPhone += '(' + input.slice(1, 4);
    }
    if (input.length >= 4) {
      formattedPhone += ')-' + input.slice(4, 7);
    }
    if (input.length >= 7) {
      formattedPhone += '-' + input.slice(7, 11);
    }

    setPhone(formattedPhone);
  };

  const handleSubmit = () => {
    if (!address || !phone) {
      alert('Please fill in all fields.');
      return;
    }

    // Added validation to ensure phone number is complete
    if (phone.length < 15) {
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

      {/* Order Summary in White Box */}
      <div className="checkout-order-summary">
        <h3>Ваш Заказ:</h3>
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
          <p>Ваша корзина пуста.</p>
        )}
      </div>

      {/* Address and Phone Inputs */}
      <div style={{ marginBottom: '10px' }}>
        <label>Адрес:</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows="3"
          placeholder="Введите адрес доставки"
          className="input-box"
        ></textarea>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label>Номер:</label>
        <input
          type="text"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="Введите ваш мобильный номер"
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
