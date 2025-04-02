import React, { useState, useEffect, useCallback } from 'react';
import { faker } from '@faker-js/faker';
import MenuItem from '../components/MenuItem';
import Pagination from '../components/Pagination';
import RealTimeCharts from '../components/RealTimeCharts';
import '../styles/Menu.css';

function Menu({ testMode = false }) {
    const [mice, setMice] = useState([]);
    const [loading, setLoading] = useState(true);
    const [maxPrice, setMaxPrice] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Memoize the fetch function to prevent unnecessary re-creation
    const fetchMice = useCallback(async (min = '', max = '', sort = '') => {
        if (testMode) return;

        try {
            // Only show loading indicator on initial load
            if (isInitialLoad) {
                setLoading(true);
            }

            const params = new URLSearchParams();
            if (min) params.append('minPrice', min);
            if (max) params.append('maxPrice', max);
            if (sort) params.append('sortOrder', sort);

            const response = await fetch(`http://localhost:5000/api/mice?${params}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            setMice(data);
        } catch (error) {
            console.error('Error fetching mice:', error);
            setMice([]);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    }, [testMode, isInitialLoad]);

    // Initial load
    useEffect(() => {
        fetchMice();
    }, [fetchMice]);

    // Handle filter changes with debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchMice(minPrice, maxPrice, sortOrder);
        }, 500);

        return () => clearTimeout(handler);
    }, [minPrice, maxPrice, sortOrder, fetchMice]);

    const addFakeMouse = async () => {
        try {
            const newMouse = {
                name: `${faker.company.name()} ${faker.commerce.productName()}`,
                image: faker.image.urlLoremFlickr({ category: 'technics', width: 640, height: 480 }),
                price: parseFloat(faker.commerce.price({ min: 100, max: 1000, dec: 2 })),
                details: faker.lorem.paragraph(),
                isFake: true
            };

            const response = await fetch('http://localhost:5000/api/mice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMouse)
            });

            if (!response.ok) throw new Error('Failed to add mouse');

            const savedMouse = await response.json();
            setMice(prev => [...prev, savedMouse]);
        } catch (error) {
            console.error('Error adding fake mouse:', error);
        }
    };

    const deleteRandomMouse = async () => {
        try {
            const fakeMice = mice.filter(mouse => mouse.isFake);
            if (fakeMice.length === 0) return;

            const randomMouse = fakeMice[Math.floor(Math.random() * fakeMice.length)];

            const response = await fetch(`http://localhost:5000/api/mice/${randomMouse.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete mouse');

            setMice(prev => prev.filter(mouse => mouse.id !== randomMouse.id));
        } catch (error) {
            console.error('Error deleting mouse:', error);
        }
    };

    useEffect(() => {
        if (testMode || !isGenerating) return;

        const addInterval = setInterval(addFakeMouse, 5000);
        const deleteInterval = setInterval(deleteRandomMouse, 10000);

        return () => {
            clearInterval(addInterval);
            clearInterval(deleteInterval);
        };
    }, [isGenerating, testMode]);

    const toggleGeneration = () => {
        setIsGenerating(prev => !prev);
    };

    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const prices = mice.map(item => item.price);
    const minItemPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxItemPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = mice.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(mice.length / itemsPerPage);

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

    if (loading && isInitialLoad && !testMode) {
        return <div className="loading">Loading mice...</div>;
    }

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
                {currentItems.map((menuItem) => (
                    <div key={menuItem.id || menuItem._id || Math.random()} style={{ position: 'relative' }} data-testid="mouse-card">
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
                <RealTimeCharts items={mice} />
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