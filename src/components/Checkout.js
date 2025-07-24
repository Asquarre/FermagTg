
import React, { useState } from 'react';
import InputMask from 'react-input-mask';

const Checkout = ({ onSubmit, cart, onBack }) => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('Ваша корзина пуста.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (!address.trim() || digits.length < 11) {
      alert('Пожалуйста, введите адрес и полный номер телефона.');
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        address: address.trim(),
        phone,
        timestamp: new Date().toISOString(),
      });
      } finally {
      setIsLoading(false);
    }
  };

  const total = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);

  return (
    <div>
      <button className="go-back-button" onClick={onBack}>
        &larr; Назад
      </button>

      <h2 className="checkout-heading">Корзина</h2>
      <div className="checkout-order-summary">
        <h3>Ваш заказ:</h3>
        {cart.length ? (
          <>
            <ul>
              {cart.map((item) => (
                <li key={item.id}>
                  {item.name} — {item.quantity} × ₸{item.price.toFixed(2)} = ₸
                  {(item.quantity * item.price).toFixed(2)}
                </li>
              ))}
            </ul>
            <div className="total">
              Сумма Заказа: ₸{total.toFixed(2)}
            </div>
          </>
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

      <button
        className="submit-order-button"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? <div className="loading-spinner" /> : 'Заказать'}
      </button>
    </div>
  );
};

export default Checkout;
