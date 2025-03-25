// src/pages/Menu.js
import React, { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { MenuList } from '../helpers/MenuList';
import MenuItem from '../components/MenuItem';
import Pagination from '../components/Pagination';
import RealTimeCharts from '../components/RealTimeCharts';
import '../styles/Menu.css';

function Menu() {
    const [mice, setMice] = useState(() => {
        const stored = localStorage.getItem('mice');
        return stored ? JSON.parse(stored) : MenuList;
    });
    const [maxPrice, setMaxPrice] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const addFakeMouse = () => {
        const newMouse = {
            name: `${faker.company.name()} ${faker.commerce.productName()}`,
            image: faker.image.urlLoremFlickr(640, 480, 'technics', true),
            price: parseFloat(faker.commerce.price(100, 1000, 2)),
            details: faker.lorem.paragraph(),
            isFake: true
        };
        setMice(prev => [...prev, newMouse]);
    };

    const deleteRandomMouse = () => {
        setMice(prev => {
            const fakeMiceIndices = prev
                .map((item, index) => (item.isFake ? index : -1))
                .filter(index => index !== -1);
            if (fakeMiceIndices.length === 0) return prev;
            const randomIndex = fakeMiceIndices[Math.floor(Math.random() * fakeMiceIndices.length)];
            console.log(`Deleting mouse at index ${randomIndex}`);
            return prev.filter((_, index) => index !== randomIndex);
        });
    };

    useEffect(() => {
        localStorage.setItem('mice', JSON.stringify(mice));
    }, [mice]);

    useEffect(() => {
        const addInterval = setInterval(() => {
            addFakeMouse();
        }, 5000);
        // Adjust deletion interval to 10000 ms for a net addition effect
        const deleteInterval = setInterval(() => {
            deleteRandomMouse();
        }, 10000);
        return () => {
            clearInterval(addInterval);
            clearInterval(deleteInterval);
        };
    }, []);

    const filteredItems = mice
        .filter(item =>
            (maxPrice === '' || item.price <= parseFloat(maxPrice)) &&
            (minPrice === '' || item.price >= parseFloat(minPrice))
        )
        .sort((a, b) => {
            if (sortOrder === 'lowToHigh') return a.price - b.price;
            if (sortOrder === 'highToLow') return b.price - a.price;
            return 0;
        });

    const prices = filteredItems.map(item => item.price);
    const minItemPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxItemPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const handleMaxPriceChange = (e) => {
        setMaxPrice(e.target.value);
        setCurrentPage(1);
    };

    const handleMinPriceChange = (e) => {
        setMinPrice(e.target.value);
        setCurrentPage(1);
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

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
            <div className="charts">
                <h2>Mice Metrics</h2>
                <RealTimeCharts items={filteredItems} />
            </div>
            <div className="menuList">
                {currentItems.map((menuItem, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                        <MenuItem
                            image={menuItem.image}
                            name={menuItem.name}
                            price={menuItem.price}
                            details={menuItem.details}
                            minPrice={minItemPrice}
                            maxPrice={maxItemPrice}
                        />
                    </div>
                ))}
            </div>
            <button onClick={deleteRandomMouse}>Delete Random Mouse</button>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
}

export default Menu;