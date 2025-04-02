import React from 'react';
import { useNavigate } from 'react-router-dom';

function MenuItem({ image, name, price, details, minPrice, maxPrice }) {
    const navigate = useNavigate();

    // Construct full image URL if it's a relative path
    const imageUrl = image?.startsWith('http')
        ? image
        : `http://localhost:5000${image}`;

    const handleClick = () => {
        // Pass the corrected image URL in the state
        navigate('/mouseDetails', { state: { mouse: { name, price, details, image: imageUrl } } });
    };

    const getPriceLabel = (price) => {
        if (price === minPrice) return 'label-green';
        if (price === maxPrice) return 'label-red';
        return 'label-yellow';
    };

    const getLabelText = (price) => {
        if (price === minPrice) return 'Cheapest';
        if (price === maxPrice) return 'Most Expensive';
        return 'Mid Price';
    };

    return (
        <div className="menuItem">
            <div className="menuItemImage" style={{ backgroundImage: `url(${imageUrl})` }}>
                <button className="plusButton" onClick={handleClick}>+</button>
            </div>
            <div className="menuItemText">
                <h1>{name}</h1>
                <p>
                    ${price}{' '}
                    <span className={`price-label ${getPriceLabel(price)}`}>
                        {getLabelText(price)}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default MenuItem;