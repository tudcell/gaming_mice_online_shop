// Modification to your Menu component
import React, { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { MenuList } from '../helpers/MenuList';
import MenuItem from '../components/MenuItem';
import Pagination from '../components/Pagination';
import RealTimeCharts from '../components/RealTimeCharts';
import '../styles/Menu.css';

function Menu({ testMode = false }) {
    const [mice, setMice] = useState(() => {
        const stored = localStorage.getItem('mice');
        return stored ? JSON.parse(stored) : MenuList;
    });
    const [maxPrice, setMaxPrice] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isGenerating, setIsGenerating] = useState(true);
    const [itemsPerPage, setItemsPerPage] = useState(6); // Default items per page


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

    const toggleGeneration = () => {
        setIsGenerating(prev => !prev);
    };

    // Handler for changing items per page
    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); //
    };

    useEffect(() => {
        localStorage.setItem('mice', JSON.stringify(mice));
    }, [mice]);

    useEffect(() => {
        if (testMode || !isGenerating) return;

        const addInterval = setInterval(addFakeMouse, 5000);
        const deleteInterval = setInterval(deleteRandomMouse, 10000);

        return () => {
            clearInterval(addInterval);
            clearInterval(deleteInterval);
        };
    }, [testMode, isGenerating]);

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
            <h1 className="menuTitle">Our Gaming Mice</h1>
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
                <label>
                    Items Per Page:
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange} data-testid="items-per-page">
                        <option value="2">2</option>
                        <option value="4">4</option>
                        <option value="6">6</option>
                    </select>
                </label>
            </div>

            <div className="menuList">
                {currentItems.map((menuItem, index) => (
                    <div key={index} style={{ position: 'relative' }} data-testid="mouse-card">
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
            <div className="controls">
                <button onClick={addFakeMouse} data-testid="add-mouse-btn">Add Fake Mouse</button>
                <button onClick={deleteRandomMouse} data-testid="delete-mouse-btn">Delete Random Mouse</button>
                <button
                    onClick={toggleGeneration}
                    data-testid="toggle-generation-btn"
                    className={isGenerating ? "active" : ""}
                >
                    {isGenerating ? "Stop Auto Generation" : "Start Auto Generation"}
                </button>
            </div>
            <div className="charts">
                <h2>Mice Metrics</h2>
                <RealTimeCharts items={filteredItems} />
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
}

export default Menu;