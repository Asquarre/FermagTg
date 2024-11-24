import React, { useState } from 'react';

const Checkout = ({ onSubmit, cart, onBack }) => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = () => {
    if (!address || !phone) {
      alert('Please fill in all fields.');
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
        &larr; Go Back
      </button>

      <h2>Checkout</h2>

      {/* Order Summary in White Box */}
      <div className="checkout-order-summary">
        <h3>Your Order:</h3>
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
      </div>

      {/* Address and Phone Inputs */}
      <div style={{ marginBottom: '10px' }}>
        <label>Address:</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows="3"
          placeholder="Enter your address"
          className="input-box"
        ></textarea>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label>Phone:</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          className="input-box"
        />
      </div>

      {/* Submit Order Button */}
      <button className="submit-order-button" onClick={handleSubmit}>
        Submit Order
      </button>
    </div>
  );
};

export default Checkout;
