
import React, { useEffect, useState } from "react";
import InputMask from "react-input-mask";
import AnimatedNumber from './AnimatedNumber';
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { formatPrice } from '../utils';

const Checkout = ({ onSubmit, cart, onBack, onAdd, onRemove, onSetQuantity, onDelete }) => {
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState("delivery");
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [focusedItemId, setFocusedItemId] = useState(null);

  const total = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const DELIVERY_THRESHOLD = 39000;
  const isDeliveryAvailable = total >= DELIVERY_THRESHOLD;

  useEffect(() => {
    if (!isDeliveryAvailable && fulfillmentType === 'delivery') {
      setFulfillmentType('pickup');
    }
  }, [isDeliveryAvailable, fulfillmentType]);


  useEffect(() => {
    const nextDrafts = {};
    cart.forEach((item) => {
      nextDrafts[item.id] = String(item.quantity).replace('.', ',');
    });
    setQuantityDrafts(nextDrafts);
  }, [cart]);

  const handleQuantityChange = (itemId, value) => {
    const normalizedValue = value.replace(/\./g, ',').replace(/\s+/g, '');
    const isValidQuantityFormat = /^\d*(?:,\d?)?$/.test(normalizedValue);

    if (!isValidQuantityFormat) {
      return;
    }

    setQuantityDrafts((prev) => ({
      ...prev,
      [itemId]: normalizedValue,
    }));
  };

  const applyQuantity = (itemId, fallbackQuantity) => {
    const rawValue = quantityDrafts[itemId] ?? '';

    if (rawValue === '') {
      onSetQuantity(itemId, 0);
      return;
    }

    if (!/^\d+(?:,\d)?$/.test(rawValue)) {
      setQuantityDrafts((prev) => ({
        ...prev,
        [itemId]: String(fallbackQuantity).replace('.', ','),
      }));
      return;
    }

    const parsedValue = Number.parseFloat(rawValue.replace(',', '.'));

    if (!Number.isFinite(parsedValue)) {
      setQuantityDrafts((prev) => ({
        ...prev,
        [itemId]: String(fallbackQuantity).replace('.', ','),
      }));
      return;
    }

    onSetQuantity(itemId, parsedValue);
  };


  const handleFulfillmentChange = (type) => {
    if (type === 'delivery' && !isDeliveryAvailable) {
      alert('Доставка доступна только для заказов на сумму от 40 000 тенге.');
      return;
    }
    setFulfillmentType(type);
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
             <TransitionGroup component="ul" className="checkout-list">
              {cart.map((item, index) => {
                const draftValue = quantityDrafts[item.id] ?? String(item.quantity).replace('.', ',');
                const isFocused = focusedItemId === item.id;
                const showAnimatedValue = !isFocused;

                return (
                <CSSTransition
                  key={item.id}
                  timeout={280}
                  classNames="checkout-item-transition"
                  appear
                >
                   <li
                    className="checkout-item"
                    style={{ "--stagger-delay": `${index * 170}ms` }}
                  >
                    <span className="checkout-item-name">{item.name}</span>
                    <div className="checkout-item-quantity">
                      <button
                        className="quantity-button"
                        onClick={() => onRemove(item.id)}
                      >
                        -
                      </button>
                       <label className="product-quantity-input-wrap" aria-label={`Количество ${item.name}`}>
                        {showAnimatedValue ? (
                          <span className="product-quantity-value">
                            <AnimatedNumber value={item.quantity} className="qty-inline" />
                          </span>
                        ) : null}
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]+([,][0-9])?"
                          className={`product-quantity-input ${showAnimatedValue ? 'product-quantity-input--hidden' : ''}`}
                          value={draftValue}
                          onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                          onFocus={() => setFocusedItemId(item.id)}
                          onBlur={() => {
                            applyQuantity(item.id, item.quantity);
                            setFocusedItemId((prev) => (prev === item.id ? null : prev));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.currentTarget.blur();
                            }
                          }}
                          aria-label={`Введите количество для ${item.name}`}
                        />
                      </label>
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
                </CSSTransition>
              );})}
            </TransitionGroup>
            <div className="total">
              Сумма Заказа: ₸
              <AnimatedNumber value={total.toFixed(2)} />
            </div>
          </>
        ) : (
          <p>Ваша корзина пуста.</p>
        )}
        </div>
      <div className="delivery-toggle" role="group" aria-label="Способ получения">
        <button
          type="button"
          className={`delivery-toggle-option ${fulfillmentType === 'delivery' ? 'active' : ''} ${!isDeliveryAvailable ? 'disabled' : ''}`}
          onClick={() => handleFulfillmentChange('delivery')}
          aria-disabled={!isDeliveryAvailable}
        >
            <span className="delivery-toggle-label">Доставка</span>
        </button>
        <button
          type="button"
          className={`delivery-toggle-option ${fulfillmentType === 'pickup' ? 'active' : ''}`}
          onClick={() => handleFulfillmentChange('pickup')}
        >
          <span className="delivery-toggle-label">Самовывоз</span>
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
          rows="2"
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
