import React, { useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import '../styles/MouseDetails.css';

function MouseDetails() {
    const { state } = useLocation();
    const { mouse } = state;
    const { addToCart } = useContext(CartContext);
    const [message, setMessage] = useState('');

    const handleAddToCart = () => {
        addToCart(mouse);
        setMessage('Item added to cart!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="mouseDetails">
            <h1>{mouse.name}</h1>
            <img src={mouse.image} alt={mouse.name} />
            <h3>${mouse.price}</h3>
            <p>{mouse.details}</p>
            <button onClick={handleAddToCart}>Add to Cart</button>
            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default MouseDetails;