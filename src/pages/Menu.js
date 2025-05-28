import React, { useState, useEffect, useCallback, useRef } from 'react';
import MenuItem from '../components/MenuItem';
import '../styles/Menu.css';

function Menu({ testMode = false }) {
    const [mice, setMice] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [maxPrice, setMaxPrice] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');

    // Server-side pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const isMounted = useRef(true);
    const wsRef = useRef(null);

    // Use .env backend URL
    const BASE_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';
    const WS_URL = BASE_URL ? BASE_URL.replace(/^http/, 'ws') : '';

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (isMounted.current) {
                setDebouncedMinPrice(minPrice);
                setDebouncedMaxPrice(maxPrice);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [minPrice, maxPrice]);

    const fetchPaginatedMice = useCallback(async () => {
        if (testMode || !isMounted.current) return;

        if (isMounted.current) {
            setLoading(true);
            setError(null);
        }

        try {
            // Online mode - fetch from API
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', pageSize);
            if (debouncedMinPrice) params.append('minPrice', debouncedMinPrice);
            if (debouncedMaxPrice) params.append('maxPrice', debouncedMaxPrice);
            if (sortOrder === 'lowToHigh') params.append('order', 'priceAsc');
            else if (sortOrder === 'highToLow') params.append('order', 'priceDesc');

            const response = await fetch(`${BASE_URL}/api/mice/paginated?${params}`);

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            if (!isMounted.current) return;

            if (!data || !Array.isArray(data.mice)) {
                throw new Error('Invalid data structure received from server');
            }

            setMice(data.mice.filter(m => m && m.id));
            setTotalCount(data.totalCount || 0);
            setTotalPages(Math.max(1, Math.ceil((data.totalCount || 0) / pageSize)));
        } catch (error) {
            console.error('Error fetching mice:', error);
            if (isMounted.current) {
                setError(`Failed to load data. ${error.message}`);
            }
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [testMode, page, pageSize, debouncedMinPrice, debouncedMaxPrice, sortOrder, BASE_URL]);

    useEffect(() => {
        fetchPaginatedMice();
    }, [page, pageSize, debouncedMinPrice, debouncedMaxPrice, sortOrder, fetchPaginatedMice]);

    useEffect(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        if (testMode || !WS_URL) return;

        try {
            wsRef.current = new WebSocket(`${WS_URL}/ws`);

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'NEW_MOUSE' || message.type === 'UPDATED_MOUSE' || message.type === 'DELETED_MOUSE') {
                        fetchPaginatedMice();
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };
        } catch (error) {
            console.error('Error setting up WebSocket:', error);
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [fetchPaginatedMice, testMode, WS_URL]);

    const resetFilters = () => {
        setPage(1);
    };

    const handleMaxPriceChange = (e) => {
        setMaxPrice(e.target.value);
        resetFilters();
    };

    const handleMinPriceChange = (e) => {
        setMinPrice(e.target.value);
        resetFilters();
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
        resetFilters();
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    if (loading && mice.length === 0) {
        return <div className="loading">Loading mice...</div>;
    }

    return (
        <div className="menu">
            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                    <button onClick={() => fetchPaginatedMice()}>Retry</button>
                </div>
            )}

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
            </div>

            <div className="pagination-controls">
                <button onClick={() => handlePageChange(1)} disabled={page === 1 || loading}>First</button>
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1 || loading}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages || loading}>Next</button>
                <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages || loading}>Last</button>
                <select value={pageSize} onChange={handlePageSizeChange} disabled={loading}>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={48}>48 per page</option>
                </select>
            </div>

            <div className="menuList">
                {mice.length > 0 ? (
                    mice.map((mouse) => {
                        if (!mouse) return null;
                        return (
                            <MenuItem
                                key={mouse.id || `mouse-${Math.random()}`}
                                id={mouse.id}
                                image={mouse.image || '/assets/default-mouse.png'}
                                name={mouse.name || 'Unnamed Mouse'}
                                price={parseFloat(mouse.price) || 0}
                                details={mouse.details || 'No details available'}
                            />
                        );
                    })
                ) : (
                    <div className="no-mice">No mice available</div>
                )}
            </div>

            {loading && mice.length > 0 && <p className="loading-more">Loading...</p>}

            <div className="pagination-controls">
                <button onClick={() => handlePageChange(1)} disabled={page === 1 || loading}>First</button>
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1 || loading}>Previous</button>
                <span>Page {page} of {totalPages} (Total: {totalCount} items)</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages || loading}>Next</button>
                <button onClick={() => handlePageChange(totalPages)} disabled={page === totalPages || loading}>Last</button>
            </div>
        </div>
    );
}

export default Menu;