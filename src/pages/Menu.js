import React, { useState, useEffect, useCallback, useRef } from 'react';
import MenuItem from '../components/MenuItem';
import StatusIndicator from '../components/StatusIndicator';
import useOfflineSupport from '../hooks/useOfflineSupport';
import '../styles/Menu.css';

function Menu({ testMode = false }) {
    const [mice, setMice] = useState([]);
    const [visibleMice, setVisibleMice] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [maxPrice, setMaxPrice] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
    const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');
    const { isOnline, isServerUp } = useOfflineSupport();
    const isOfflineMode = !isOnline || !isServerUp;

    // Configuration
    const itemsPerPage = 6;
    const loadingRef = useRef(false);
    const scrollPosRef = useRef(0);
    const allDataRef = useRef([]);
    const observer = useRef(null);
    const lastItemRef = useRef(null);
    const firstItemRef = useRef(null);
    const isMounted = useRef(true);

    // Add mounted ref to prevent state updates after unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Debounce price filters
    useEffect(() => {
        const handler = setTimeout(() => {
            if (isMounted.current) {
                setDebouncedMinPrice(minPrice);
                setDebouncedMaxPrice(maxPrice);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [minPrice, maxPrice]);

    // Apply filters locally
    const applyFilters = useCallback((miceData) => {
        if (!miceData) return [];

        let filtered = [...miceData];

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

        return filtered;
    }, [debouncedMinPrice, debouncedMaxPrice, sortOrder]);

    // Fetch initial mice with filters - with safety checks
    const fetchInitialMice = useCallback(async () => {
        if (testMode || !isMounted.current) return;

        loadingRef.current = true;
        if (isMounted.current) setLoading(true);

        try {
            // Handle offline mode
            if (isOfflineMode) {
                let storedMice = [];
                try {
                    storedMice = JSON.parse(localStorage.getItem('cachedMice') || '[]');
                } catch (err) {
                    console.error('Error parsing cached mice:', err);
                }

                allDataRef.current = storedMice;
                const filtered = applyFilters(storedMice);

                if (isMounted.current) {
                    setMice(filtered);
                    setVisibleMice(filtered.slice(0, itemsPerPage));
                    setHasMore(filtered.length > itemsPerPage);
                    setPage(1);
                }
                return;
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (debouncedMinPrice) params.append('minPrice', debouncedMinPrice);
            if (debouncedMaxPrice) params.append('maxPrice', debouncedMaxPrice);
            if (sortOrder) params.append('sortOrder', sortOrder);

            const response = await fetch(`http://localhost:5002/api/mice?${params}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            // Cache all data
            try {
                localStorage.setItem('cachedMice', JSON.stringify(data));
            } catch (err) {
                console.error('Error caching mice:', err);
            }

            allDataRef.current = data;

            // Only update state if component is still mounted
            if (isMounted.current) {
                const filtered = applyFilters(data);
                setMice(filtered);
                setVisibleMice(filtered.slice(0, itemsPerPage));
                setHasMore(filtered.length > itemsPerPage);
                setPage(1);
            }
        } catch (error) {
            console.error('Error fetching mice:', error);

            // Use cached data if available
            let storedMice = [];
            try {
                storedMice = JSON.parse(localStorage.getItem('cachedMice') || '[]');
            } catch (err) {
                console.error('Error parsing cached mice:', err);
            }

            if (storedMice.length > 0 && isMounted.current) {
                const filtered = applyFilters(storedMice);
                setMice(filtered);
                setVisibleMice(filtered.slice(0, itemsPerPage));
                setHasMore(filtered.length > itemsPerPage);
            }
        } finally {
            if (isMounted.current) setLoading(false);
            loadingRef.current = false;
        }
    }, [testMode, debouncedMinPrice, debouncedMaxPrice, sortOrder, isOfflineMode, applyFilters, itemsPerPage]);

    // Load more mice when scrolling down - with safety checks
    const loadMoreMice = useCallback(() => {
        if (loadingRef.current || !hasMore || !isMounted.current) return;

        loadingRef.current = true;
        if (isMounted.current) setLoading(true);

        try {
            const nextPage = page + 1;
            const startIndex = (nextPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;

            // Check if we have more items to show
            if (startIndex >= mice.length) {
                if (isMounted.current) setHasMore(false);
                return;
            }

            // Get the next batch of items
            const nextBatch = mice.slice(startIndex, endIndex);

            // Add them to visible mice
            if (isMounted.current) {
                setVisibleMice(prev => [...prev, ...nextBatch]);
                setPage(nextPage);
                setHasMore(endIndex < mice.length);
            }
        } finally {
            if (isMounted.current) setLoading(false);
            loadingRef.current = false;
        }
    }, [hasMore, mice, page, itemsPerPage]);

    // Handle scrolling back to top - with safety check
    const handleScroll = useCallback(() => {
        if (!isMounted.current) return;

        const scrollPosition = window.scrollY;
        const scrollDirection = scrollPosition < scrollPosRef.current ? 'up' : 'down';
        scrollPosRef.current = scrollPosition;

        // When scrolling up and near the top, reset to initial items
        if (scrollDirection === 'up' && scrollPosition < 200 && visibleMice.length > itemsPerPage) {
            setVisibleMice(mice.slice(0, itemsPerPage));
            setPage(1);
            setHasMore(true);
        }
    }, [mice, visibleMice.length, itemsPerPage]);

    // Fetch mice when filters or sorting changes
    useEffect(() => {
        fetchInitialMice();
    }, [debouncedMinPrice, debouncedMaxPrice, sortOrder, fetchInitialMice]);

    // Set up scroll listener for unloading on scroll up
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    // Set up intersection observer for infinite scrolling down - with safety checks
    useEffect(() => {
        // Clean up previous observer if it exists
        if (observer.current) {
            observer.current.disconnect();
        }

        const options = {
            root: null,
            rootMargin: '20px',
            threshold: 0.1
        };

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingRef.current && hasMore && isMounted.current) {
                loadMoreMice();
            }
        }, options);

        if (lastItemRef.current) {
            observer.current.observe(lastItemRef.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
                observer.current = null;
            }
        };
    }, [hasMore, loadMoreMice, visibleMice]);

    const resetFilters = () => {
        setPage(1);
        setHasMore(true);
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

    if (loading && visibleMice.length === 0) {
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

            <div className="menuList">
                {visibleMice.length > 0 ? (
                    visibleMice.map((menuItem, index) => {
                        if (!menuItem) return null;

                        // Check if this is the last item
                        const isLastItem = index === visibleMice.length - 1;
                        // Check if this is the first item
                        const isFirstItem = index === 0;

                        return (
                            <div
                                key={menuItem.id || menuItem._id || `menu-${index}`}
                                ref={isLastItem ? lastItemRef : isFirstItem ? firstItemRef : null}
                            >
                                <MenuItem
                                    id={menuItem.id || menuItem._id}
                                    image={menuItem.image}
                                    name={menuItem.name}
                                    price={menuItem.price}
                                    details={menuItem.details}
                                />
                            </div>
                        );
                    })
                ) : (
                    <div className="no-mice">No mice available</div>
                )}
            </div>

            {loading && visibleMice.length > 0 && <p className="loading-more">Loading more...</p>}
            {!hasMore && visibleMice.length > itemsPerPage && (
                <p className="total-count">Showing {visibleMice.length} of {mice.length} mice</p>
            )}
        </div>
    );
}

export default Menu;