import React from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useContext } from "react";

function MenuItem({ image, name, price, details, id }) {
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);

    // Create proper image URL for server-hosted images
    const getImagePath = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/150?text=No+Image';

        // If the path already starts with http or https, use it directly
        if (imagePath.startsWith('http')) return imagePath;

        // Remove leading slash if present
        const path = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

        // Return the URL pointing to your server
        return `http://localhost:5002/${path}`;
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const mouseItem = {
            id: id || `${name}-${Date.now()}`,
            name,
            price: Number(price),
            image: image, // Store original path
            details
        };

        addToCart(mouseItem);
    };

    const handleClick = () => {
        navigate("/mouseDetails", {
            state: {
                mouse: { id, name, price, image, details }
            }
        });
    };

    return (
        <div className="menuItem">
            <div className="menuItemImage" onClick={handleClick}>
                <img
                    src={getImagePath(image)}
                    alt={name}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                    }}
                />
            </div>
            <div className="menuItemText">
                <h1>{name}</h1>
                <p>${typeof price === 'number' ? price.toFixed(2) : price}</p>
            </div>
            <button className="plusButton" onClick={handleAddToCart}>+</button>
        </div>
    );
}

export default MenuItem;