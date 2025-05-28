import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import '../styles/MouseDetails.css';

function MouseDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const mouseState = location.state || {};
    const mouse = mouseState.mouse || {};
    const { addToCart } = useContext(CartContext);
    const [message, setMessage] = useState('');
    const [imageError, setImageError] = useState(false);

    // Use .env backend URL for server-hosted images
    const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';

    if (!mouse || Object.keys(mouse).length === 0) {
        return (
            <div className="mouseDetails">
                <div className="error-message">
                    <h2>No mouse details available</h2>
                    <button onClick={() => navigate('/menu')}>Return to Catalog</button>
                </div>
            </div>
        );
    }

    const getImagePath = () => {
        try {
            if (!mouse.image) return '';
            if (mouse.image.startsWith('http')) return mouse.image;
            const path = mouse.image.startsWith('/') ? mouse.image.substring(1) : mouse.image;
            return `${API_BASE}/${path}`;
        } catch (error) {
            console.error("Error processing image path:", error);
            return '';
        }
    };

    const handleAddToCart = () => {
        try {
            const mouseWithId = {
                id: mouse.id || `${mouse.name}-${Date.now()}`,
                name: mouse.name || 'Unknown Mouse',
                price: Number(mouse.price) || 0,
                image: imageError ? '' : getImagePath(),
                details: mouse.details || ''
            };
            addToCart(mouseWithId);
            setMessage('Item added to cart!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error adding to cart:", error);
            setMessage('Failed to add item to cart');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="mouseDetails">
            <h1>{mouse.name || 'Unknown Mouse'}</h1>
            <div className="mouse-image">
                {!imageError ? (
                    <img
                        src={getImagePath()}
                        alt={mouse.name || 'Mouse image'}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="image-placeholder">Image not available</div>
                )}
            </div>
            <div className="mouse-info">
                <h3>${typeof mouse.price === 'number' ? mouse.price.toFixed(2) : (mouse.price || '0.00')}</h3>
                <p className="details">{mouse.details || 'No details available'}</p>
                <div className="actions">
                    <button className="add-cart-button" onClick={handleAddToCart}>
                        Add to Cart
                    </button>
                    <button className="view-cart-button" onClick={() => navigate('/cart')}>
                        View Cart
                    </button>
                </div>
                {message && <p className="message success">{message}</p>}
            </div>
        </div>
    );
}

export default MouseDetails;