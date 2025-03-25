import React from 'react';
import {useNavigate} from 'react-router-dom';


function MenuItem({image, name, price, details}) {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate('/mouseDetails', {state: {mouse: {name, price, details, image}}});
    };

    return (
        <div className="menuItem">
            <div className="menuItemImage" style={{backgroundImage: `url(${image})`}}>
                <button className="plusButton" onClick={handleClick}>+</button>
            </div>
            <h1>{name}</h1>
            <p>${price}</p>
        </div>
    );
}

export default MenuItem;