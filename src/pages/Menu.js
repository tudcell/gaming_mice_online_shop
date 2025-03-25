import React, { useState } from 'react';
import { MenuList } from '../helpers/MenuList';
import MenuItem from '../components/MenuItem';
import '../styles/Menu.css';

function Menu() {
    const [maxPrice, setMaxPrice] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');

    const handleMaxPriceChange = (e) => {
        setMaxPrice(e.target.value);
    };

    const handleMinPriceChange = (e) => {
        setMinPrice(e.target.value);
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
    };

    const filteredItems = MenuList
        .filter(item => (maxPrice === '' || item.price <= parseFloat(maxPrice)) && (minPrice === '' || item.price >= parseFloat(minPrice)))
        .sort((a, b) => {
            if (sortOrder === 'lowToHigh') {
                return a.price - b.price;
            } else if (sortOrder === 'highToLow') {
                return b.price - a.price;
            } else {
                return 0;
            }
        });

    return (
        <div className="menu">
            <h1 className="menuTitle">Our Offer</h1>
            <div className="filters">
                <label>
                    Min Price:
                    <input
                        type="number"
                        value={minPrice}
                        onChange={handleMinPriceChange}
                        min="0"
                    />
                </label>
                <label>
                    Max Price:
                    <input
                        type="number"
                        value={maxPrice}
                        onChange={handleMaxPriceChange}
                        min="0"
                    />
                </label>
                <label>
                    Sort By:
                    <select value={sortOrder} onChange={handleSortOrderChange}>
                        <option value="">None</option>
                        <option value="lowToHigh">Price: Low to High</option>
                        <option value="highToLow">Price: High to Low</option>
                    </select>
                </label>
            </div>
            <div className="menuList">
                {filteredItems.map((menuItem, key) => (
                    <MenuItem
                        key={key}
                        image={menuItem.image}
                        name={menuItem.name}
                        price={menuItem.price}
                        mouse={menuItem}
                        details={menuItem.details}
                    />
                ))}
            </div>
        </div>
    );
}

export default Menu;