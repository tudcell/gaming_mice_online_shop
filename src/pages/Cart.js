// Language: JavaScript
import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import '../styles/Cart.css';

function Cart() {
    const { cart, removeFromCart, updateCartItemQuantity } = useContext(CartContext);

    const handleQuantityChange = (item, quantity) => {
        const parsedQuantity = parseInt(quantity, 10);
        if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
            updateCartItemQuantity(item.id, parsedQuantity);
        } else {
            alert('Please enter a valid quantity');
        }
    };

    // Calculate total price
    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0).toFixed(2);
    };

    // Create proper image URL for server-hosted images using dynamic hostname
    const getImagePath = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/150?text=No+Image';
        if (imagePath.startsWith('http')) return imagePath;
        const path = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `http://${window.location.hostname}:5002/${path}`;
    };

    return (
        <div className="cart">
            <h1>Shopping Cart</h1>
            {cart.length === 0 ? (
                <p>Your cart is empty</p>
            ) : (
                <>
                    <ul className="cart-items">
                        {cart.map((item) => (
                            <li key={item.id || item.name} className="cart-item">
                                <div className="item-image">
                                    <img
                                        src={getImagePath(item.image)}
                                        alt={item.name}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="item-details">
                                    <h3>{item.name}</h3>
                                    <p className="item-price">${item.price} each</p>
                                    <div className="quantity-control">
                                        <label>Quantity:</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(item, e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                    <p className="item-total">Item total: ${(item.price * item.quantity).toFixed(2)}</p>
                                    <button
                                        className="remove-button"
                                        onClick={() => removeFromCart(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="cart-total">
                        <h3>Total: ${calculateTotal()}</h3>
                        <button className="checkout-button">Proceed to Checkout</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Cart;