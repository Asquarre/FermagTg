
import React, { useEffect, useState } from "react";
import InputMask from "react-input-mask";
import AnimatedNumber from './AnimatedNumber';
import { formatPrice } from '../utils';

const Checkout = ({ onSubmit, cart, onBack, onAdd, onRemove, onDelete }) => {
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState("delivery");
  const [animationDirection, setAnimationDirection] = useState(null);

  useEffect(() => {
    if (!animationDirection) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setAnimationDirection(null);
    }, 650);

    return () => clearTimeout(timeout);
  }, [animationDirection]);

  const handleFulfillmentChange = (nextType) => {
    if (nextType === fulfillmentType) {
      return;
    }

    setAnimationDirection(nextType === "delivery" ? "to-delivery" : "to-pickup");
    setFulfillmentType(nextType);
  };
  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('Ваша корзина пуста.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (
      !customerName.trim() ||
      (fulfillmentType === 'delivery' && !address.trim()) ||
      digits.length < 11
    ) {
      alert(
        fulfillmentType === 'delivery'
          ? 'Пожалуйста, введите наименование заказчика, адрес и полный номер телефона.'
          : 'Пожалуйста, введите наименование заказчика и полный номер телефона.'
      );
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        customerName: customerName.trim(),
        address: address.trim(),
        phone,
        fulfillmentType: fulfillmentType === 'delivery' ? 'Доставка' : 'Самовывоз',
        timestamp: new Date().toISOString(),
      });
      } finally {
      setIsLoading(false);
    }
  };

  const total = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const toggleClasses = ['delivery-toggle', fulfillmentType];

  if (animationDirection) {
    toggleClasses.push('is-animating', animationDirection);
  }
  return (
    <div>
      <button className="go-back-button" onClick={onBack}>
        &larr; Назад
      </button>

      <h2 className="checkout-heading">Корзина</h2>
      <div className="checkout-order-summary">
        <h3><strong>Ваш заказ</strong></h3>
        {cart.length ? (
          <>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {cart.map((item) => (
                <li key={item.id} className="checkout-item">
                  <span className="checkout-item-name">{item.name}</span>
                  <div className="checkout-item-quantity">
                    <button
                      className="quantity-button"
                      onClick={() => onRemove(item.id)}
                    >
                      -
                    </button>
                    <AnimatedNumber
                      value={item.quantity}
                      className="quantity-value"
                    />
                    <button
                      className="quantity-button"
                      onClick={() => onAdd(item.id)}
                    >
                      +
                    </button>
                  </div>
                  <span className="checkout-item-price">
                    ₸
                    <AnimatedNumber
                      value={formatPrice(item.quantity * item.price)}
                    />
                  </span>
                  <button
                    className="remove-item-button"
                    onClick={() => onDelete(item.id)}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
            <div className="total">
              Сумма Заказа: ₸
              <AnimatedNumber value={total.toFixed(2)} />
            </div>
          </>
        ) : (
          <p>Ваша корзина пуста.</p>
        )}
        </div>
      <div
        className={toggleClasses.join(' ')}
        role="group"
        aria-label="Способ получения"
      >
        <span className="delivery-toggle-indicator" aria-hidden="true" />
        <button
          type="button"
          className={`delivery-toggle-option ${fulfillmentType === 'delivery' ? 'active' : ''}`}
          onClick={() => handleFulfillmentChange('delivery')}
        >
          Доставка
        </button>
        <button
          type="button"
          className={`delivery-toggle-option ${fulfillmentType === 'pickup' ? 'active' : ''}`}
          onClick={() => handleFulfillmentChange('pickup')}
        >
          Самовывоз
        </button>
      </div>
        <div style={{ margin: '10px 0' }}>
        <label className="checkout-label">Наименование заказчика:</label>
        <input
          className="input-box"
          type="text"
          placeholder="Введите наименование заказчика"
          value={customerName}
          onChange={e => setCustomerName(e.target.value)}
        />
      </div>
      <div style={{ margin: '10px 0' }}>
        <label className="checkout-label">Адрес:</label>
        <textarea
          className="input-box"
          rows="3"
          placeholder={
            fulfillmentType === 'delivery'
              ? 'Введите адрес доставки'
              : 'Введите комментарий или адрес (если требуется)'
          }
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
      </div>

      <div style={{ margin: '10px 0' }}>
        <label className="checkout-label">Номер:</label>
        <InputMask
          mask="+7(999)-999-9999"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+7(___)-___-____"
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
