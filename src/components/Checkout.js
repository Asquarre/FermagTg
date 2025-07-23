
import React, { useState } from 'react';
import InputMask from 'react-input-mask';

const Checkout = ({ onSubmit, cart, onBack }) => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = () => {
    const digits = phone.replace(/\D/g, '');
    if (!address.trim() || digits.length < 11) {
      alert('Пожалуйста, введите адрес и полный номер телефона.');
      return;
    }
    onSubmit({
      address: address.trim(),
      phone,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div>
      <button className="go-back-button" onClick={onBack}>
        &larr; Назад
      </button>

      <h2 className="checkout-heading">Корзина</h2>
      <div className="checkout-order-summary">
        <h3>Ваш заказ:</h3>
        {cart.length ? (
          <ul>
            {cart.map(item => (
              <li key={item.id}>
                {item.name} — {item.quantity} × ₸{item.price.toFixed(2)} = ₸
                {(item.quantity * item.price).toFixed(2)}
              </li>
            ))}
          </ul>
        ) : (
          <p>Ваша корзина пуста.</p>
        )}
      </div>

      <div style={{ margin: '10px 0' }}>
        <label className="checkout-label">Адрес:</label>
        <textarea
          className="input-box"
          rows="3"
          placeholder="Введите адрес доставки"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      <div style={{ margin: '10px 0' }}>
        <label className="checkout-label">Номер:</label>
        <InputMask
          mask="+8(999)-999-9999"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+8(___)-___-____"
        >
          {inputProps => (
            <input
              {...inputProps}
              type="text"
              className="input-box"
            />
          )}
        </InputMask>
      </div>

      <button className="submit-order-button" onClick={handleSubmit}>
        Заказать
      </button>
    </div>
  );
};

export default Checkout;
