import React, { useState, useEffect, useCallback, useRef } from 'react';
import MenuItem from '../components/MenuItem';
import StatusIndicator from '../components/StatusIndicator';
import useOfflineSupport from '../hooks/useOfflineSupport';
import '../styles/Menu.css';

function Menu({ testMode = false }) {
    const [mice, setMice] = useState([]);
    const [loading, setLoading] = useState(true);
    const [maxPrice, setMaxPrice] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');
    const { isOnline, isServerUp } = useOfflineSupport();
    const isOfflineMode = !isOnline || !isServerUp;

    // Server-side pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const isMounted = useRef(true);
    const BASE_URL = `http://${window.location.hostname}:5002`;

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

        if (isMounted.current) setLoading(true);

        try {
            if (isOfflineMode) {
                let storedMice = [];
                try {
                    storedMice = JSON.parse(localStorage.getItem('cachedMice') || '[]');
                } catch (err) {
                    console.error('Error parsing cached mice:', err);
                }

                // Apply filters client-side in offline mode
                let filtered = [...storedMice];
                if (debouncedMinPrice) {
                    filtered = filtered.filter(m => m && m.price >= parseFloat(debouncedMinPrice));
                }
                if (debouncedMaxPrice) {
                    filtered = filtered.filter(m => m && m.price <= parseFloat(debouncedMaxPrice));
                }
                if (sortOrder === 'lowToHigh') {
                    filtered.sort((a, b) => (a?.price || 0) - (b?.price || 0));
                } else if (sortOrder === 'highToLow') {
                    filtered.sort((a, b) => (b?.price || 0) - (a?.price || 0));
                }

                // Manual pagination for offline mode
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedResults = filtered.slice(startIndex, endIndex);

                if (isMounted.current) {
                    setMice(paginatedResults);
                    setTotalCount(filtered.length);
                    setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
                }
                return;
            }

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

            if (isMounted.current) {
                setMice(data.mice || []);
                setTotalCount(data.totalCount || 0);
                setTotalPages(data.totalPages || 1);
            }

            // Cache first page results for offline use
            if (page === 1) {
                try {
                    localStorage.setItem('cachedMice', JSON.stringify(data.mice || []));
                } catch (err) {
                    console.error('Error caching mice:', err);
                }
            }
        } catch (error) {
            console.error('Error fetching mice:', error);
            // Try to load from cache in case of error
            if (page === 1) {
                let storedMice = [];
                try {
                    storedMice = JSON.parse(localStorage.getItem('cachedMice') || '[]');
                    if (storedMice.length > 0 && isMounted.current) {
                        setMice(storedMice);
                        setTotalCount(storedMice.length);
                        setTotalPages(Math.ceil(storedMice.length / pageSize) || 1);
                    }
                } catch (err) {
                    console.error('Error parsing cached mice:', err);
                }
            }
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [testMode, page, pageSize, debouncedMinPrice, debouncedMaxPrice, sortOrder, isOfflineMode, BASE_URL]);

    useEffect(() => {
        fetchPaginatedMice();
    }, [page, pageSize, debouncedMinPrice, debouncedMaxPrice, sortOrder, fetchPaginatedMice]);

    useEffect(() => {
        const ws = new WebSocket(`ws://${window.location.hostname}:5002`);
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'NEW_MOUSE' || message.type === 'UPDATED_MOUSE' || message.type === 'DELETED_MOUSE') {
                    // Refresh current page when data changes
                    fetchPaginatedMice();
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
            }
        };
        return () => {
            ws.close();
        };
    }, [fetchPaginatedMice]);

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
        setPage(newPage);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1); // Reset to first page when changing page size
    };

    if (loading && mice.length === 0) {
        return <div className="loading">Loading mice...</div>;
    }

    return (
        <div className="menu">
            <StatusIndicator isOnline={isOnline} isServerUp={isServerUp} />
            {isOfflineMode && (
                <div className="offline-alert">
                    <p>Currently working in offline mode. Changes will sync when connection is restored.</p>
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

            {/* Pagination controls */}
            <div className="pagination-controls">
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1 || loading}
                >
                    First
                </button>
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || loading}
                >
                    Next
                </button>
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages || loading}
                >
                    Last
                </button>
                <select value={pageSize} onChange={handlePageSizeChange} disabled={loading}>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={48}>48 per page</option>
                </select>
            </div>

            <div className="menuList">
                {mice.length > 0 ? (
                    mice.map((menuItem, index) => {
                        if (!menuItem) return null;
                        return (
                            <div key={menuItem.id || menuItem._id || `menu-${index}`}>
                                <MenuItem
                                    id={menuItem.id || menuItem._id}
                                    image={menuItem.image || '/assets/default-mouse.png'}
                                    name={menuItem.name || 'Unnamed Mouse'}
                                    price={parseFloat(menuItem.price) || 0}
                                    details={menuItem.details || 'No details available'}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div className="no-mice">No mice available</div>
                )}
            </div>

            {loading && mice.length > 0 && <p className="loading-more">Loading...</p>}

            {/* Duplicate pagination controls at the bottom for better UX */}
            <div className="pagination-controls">
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1 || loading}
                >
                    First
                </button>
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages} (Total: {totalCount} items)</span>
                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || loading}
                >
                    Next
                </button>
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages || loading}
                >
                    Last
                </button>
            </div>
        </div>
    );
}

export default Menu;