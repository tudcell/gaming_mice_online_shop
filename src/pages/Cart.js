import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import '../styles/Cart.css';

function Cart() {
    const { cart, removeFromCart, updateCartItem } = useContext(CartContext);

    const handleQuantityChange = (item, quantity) => {
        const parsedQuantity = parseInt(quantity, 10);
        if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
            updateCartItem(item, parsedQuantity);
        } else {
            alert('Please enter a valid quantity');
        }
    };

    return (
        <div className="cart">
            <h1>Shopping Cart</h1>
            {cart.length === 0 ? (
                <p>Your cart is empty</p>
            ) : (
                <ul>
                    {cart.map((item, index) => (
                        <li key={index}>
                            <img src={item.image} alt={item.name} />
                            <div>
                                <h3>{item.name}</h3>
                                <p>${item.price}</p>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                                    min="1"
                                />
                                <button onClick={() => removeFromCart(item)}>Remove</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Cart;