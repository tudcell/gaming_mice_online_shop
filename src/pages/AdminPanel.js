import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RealTimeCharts from '../components/RealTimeCharts';
import RealTimeBarChart from '../components/RealTimeBarChart';
import RealTimePieChart from '../components/RealTimePieChart';
import '../styles/AdminPanel.css';

function AdminPanel() {
    const BASE_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || '';
    const WS_URL = BASE_URL
        ? BASE_URL.replace(/^http/, 'ws')
        : '';

    const [mice, setMice] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [offlineQueue, setOfflineQueue] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [genRunning, setGenRunning] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch generation status from the server
    const refreshGenerationState = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/generation/status`);
            setGenRunning(response.data.running);
        } catch (error) {
            console.error('Error fetching generation status:', error);
        }
    };

    useEffect(() => {
        fetchPaginatedMice();
        const storedQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        setOfflineQueue(storedQueue);

        const socket = new WebSocket(WS_URL);
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'NEW_MOUSE':
                    // Only add to current view if we're on the first page
                    if (page === 1) {
                        setMice(prev => [message.data, ...prev.slice(0, pageSize - 1)]);
                    }
                    setTotalCount(prev => prev + 1);
                    setTotalPages(Math.ceil((totalCount + 1) / pageSize));
                    break;
                case 'UPDATED_MOUSE':
                    setMice(prev => prev.map(mouse => mouse.id === message.data.id ? message.data : mouse));
                    break;
                case 'DELETED_MOUSE':
                    setMice(prev => prev.filter(mouse => mouse.id !== message.data.id));
                    setTotalCount(prev => prev - 1);
                    setTotalPages(Math.ceil((totalCount - 1) / pageSize));
                    break;
                case 'INITIAL_DATA':
                    if (message.data && Array.isArray(message.data)) {
                        setMice(message.data);
                    }
                    if (message.meta) {
                        setTotalCount(message.meta.totalCount || 0);
                        setTotalPages(Math.ceil(message.meta.totalCount / pageSize));
                    }
                    setGenRunning(message.genRunning || false);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        };
        return () => { socket.close(); };
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            syncOfflineChanges();
            refreshGenerationState();
        };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [offlineQueue]);

    // Update when pagination changes
    useEffect(() => {
        fetchPaginatedMice();
    }, [page, pageSize]);

    const fetchPaginatedMice = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/api/mice/paginated`, {
                params: { page, pageSize }
            });
            setMice(response.data.mice);
            setTotalCount(response.data.totalCount);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching paginated mice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        try {
            setUploading(true);
            const response = await axios.post(`${BASE_URL}/api/upload`, fileData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('File uploaded successfully. File path:', response.data.filePath);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setUploading(false);
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const mouseData = { ...formData, price: parseFloat(formData.price) || 0 };

        try {
            setLoading(true);
            if (navigator.onLine) {
                if (editingId) {
                    await axios.patch(`${BASE_URL}/api/mice/${editingId}`, mouseData);
                    setMice(prev => prev.map(mouse => mouse.id === editingId ? { ...mouse, ...mouseData } : mouse));
                } else {
                    const response = await axios.post(`${BASE_URL}/api/mice`, mouseData);
                    // Only add to current view if we're on the first page
                    if (page === 1) {
                        setMice(prev => [response.data, ...prev.slice(0, pageSize - 1)]);
                    }
                    setTotalCount(prev => prev + 1);
                    setTotalPages(Math.ceil((totalCount + 1) / pageSize));
                }
            } else {
                if (editingId) {
                    const updatedQueue = offlineQueue.map(item =>
                        item.type === 'UPDATE' && item.data.id === editingId ? { ...item, data: { ...mouseData, id: editingId } } : item
                    );
                    if (!updatedQueue.some(item => item.type === 'UPDATE' && item.data.id === editingId)) {
                        updatedQueue.push({ type: 'UPDATE', data: { ...mouseData, id: editingId } });
                    }
                    setOfflineQueue(updatedQueue);
                    localStorage.setItem('offlineQueue', JSON.stringify(updatedQueue));
                    setMice(prev => prev.map(mouse => mouse.id === editingId ? { ...mouse, ...mouseData } : mouse));
                } else {
                    const newMouse = { ...mouseData, id: Date.now() };
                    const updatedQueue = [...offlineQueue, { type: 'ADD', data: newMouse }];
                    setOfflineQueue(updatedQueue);
                    localStorage.setItem('offlineQueue', JSON.stringify(updatedQueue));
                    // Only add to current view if we're on the first page
                    if (page === 1) {
                        setMice(prev => [newMouse, ...prev.slice(0, pageSize - 1)]);
                    }
                    setTotalCount(prev => prev + 1);
                    setTotalPages(Math.ceil((totalCount + 1) / pageSize));
                }
            }
            setEditingId(null);
            setFormData({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
        } catch (error) {
            console.error('Error saving mouse:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this mouse?')) {
            setLoading(true);
            if (navigator.onLine) {
                try {
                    await axios.delete(`${BASE_URL}/api/mice/${id}`);
                    // Remove from current view
                    setMice(prev => prev.filter(mouse => mouse.id !== id));
                    setTotalCount(prev => prev - 1);
                    setTotalPages(Math.ceil((totalCount - 1) / pageSize));
                } catch (error) {
                    console.error('Error deleting mouse:', error);
                }
            } else {
                const updatedQueue = [...offlineQueue, { type: 'DELETE', data: { id } }];
                setOfflineQueue(updatedQueue);
                localStorage.setItem('offlineQueue', JSON.stringify(updatedQueue));
                setMice(prev => prev.filter(mouse => mouse.id !== id));
                setTotalCount(prev => prev - 1);
                setTotalPages(Math.ceil((totalCount - 1) / pageSize));
            }
            setLoading(false);
        }
    };

    const handleDeleteFakeMice = async () => {
        if (window.confirm('Are you sure you want to delete all fake mice?')) {
            const fakeMice = mice.filter(mouse => mouse.details === 'Generated dynamically');
            for (const mouse of fakeMice) {
                if (navigator.onLine) {
                    try {
                        await axios.delete(`${BASE_URL}/api/mice/${mouse.id}`);
                        setTotalCount(prev => prev - 1);
                    } catch (error) {
                        console.error(`Error deleting fake mouse ${mouse.id}:`, error);
                    }
                } else {
                    const updatedQueue = [...offlineQueue, { type: 'DELETE', data: { id: mouse.id } }];
                    setOfflineQueue(updatedQueue);
                    localStorage.setItem('offlineQueue', JSON.stringify(updatedQueue));
                }
            }
            setMice(prev => prev.filter(mouse => mouse.details !== 'Generated dynamically'));
            setTotalPages(Math.ceil(totalCount / pageSize));
        }
    };

    const syncOfflineChanges = async () => {
        if (offlineQueue.length === 0 || !navigator.onLine) return;
        const queue = [...offlineQueue];
        setOfflineQueue([]);
        localStorage.removeItem('offlineQueue');
        for (const change of queue) {
            try {
                if (change.type === 'ADD') {
                    await axios.post(`${BASE_URL}/api/mice`, change.data);
                } else if (change.type === 'UPDATE') {
                    await axios.patch(`${BASE_URL}/api/mice/${change.data.id}`, change.data);
                } else if (change.type === 'DELETE') {
                    await axios.delete(`${BASE_URL}/api/mice/${change.data.id}`);
                }
            } catch (error) {
                console.error('Error syncing offline changes:', error);
            }
        }
        // Refresh the current page after syncing
        fetchPaginatedMice();
    };

    const handleEdit = (mouse) => {
        setEditingId(mouse.id);
        setFormData({
            name: mouse.name || '',
            price: mouse.price ? mouse.price.toString() : '',
            details: mouse.details || '',
            image: mouse.image || '/assets/viperv3pro.avif'
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
    };

    const toggleGeneration = async () => {
        try {
            if (genRunning) {
                await axios.post(`${BASE_URL}/api/generation/stop`);
                setGenRunning(false);
            } else {
                await axios.post(`${BASE_URL}/api/generation/start`);
                setGenRunning(true);
            }
        } catch (error) {
            console.error('Error toggling generation:', error);
        }
    };

    // Pagination handlers
    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1); // Reset to first page when changing page size
    };

    return (
        <div className="admin-panel">
            <h1>Admin Panel</h1>
            {/*<button onClick={toggleGeneration} disabled={loading}>*/}
            {/*    {genRunning ? 'Stop Generation' : 'Start Generation'}*/}
            {/*</button>*/}
            {isOffline && (
                <div className="network-warning">
                    Network/Server is down.
                </div>
            )}
            <h2>{editingId ? 'Edit Mouse' : 'Add New Mouse'}</h2>
            <div className="form-group">
                <label>Upload File:</label>
                <input type="file" onChange={handleFileChange} />
                <button type="button" onClick={handleFileUpload} disabled={uploading || !selectedFile}>
                    {uploading ? 'Uploading...' : 'Upload File'}
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Price:</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" min="0.01" required />
                </div>
                <div className="form-group">
                    <label>Details:</label>
                    <textarea name="details" value={formData.details} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label>Image Path:</label>
                    <input type="text" name="image" value={formData.image} onChange={handleInputChange} required />
                </div>
                <div className="form-buttons">
                    <button type="submit" disabled={loading}>
                        {editingId ? 'Update Mouse' : 'Add Mouse'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={cancelEdit} disabled={loading}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>
            <div className="delete-fake">
                <button onClick={handleDeleteFakeMice} disabled={loading}>
                    Delete All Fake Mice
                </button>
            </div>
            <h2>Mouse Inventory ({totalCount} total items)</h2>

            {/* Pagination controls */}
            <div className="pagination-controls">
                <button onClick={handlePrevPage} disabled={page === 1 || loading}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={page === totalPages || loading}>Next</button>
                <select value={pageSize} onChange={handlePageSizeChange} disabled={loading}>
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                </select>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <table className="mice-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {mice.length > 0 ? (
                        mice.map(mouse => (
                            <tr key={mouse.id}>
                                <td>{mouse.id}</td>
                                <td>{mouse.name}</td>
                                <td>{mouse.price}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEdit(mouse)}
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(mouse.id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="no-data">
                                No mice available
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            )}

            {/* Duplicate pagination controls at the bottom for better UX */}
            <div className="pagination-controls">
                <button onClick={handlePrevPage} disabled={page === 1 || loading}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={page === totalPages || loading}>Next</button>
            </div>

            <h2>Mouse Data Charts (Current Page)</h2>
            <RealTimeCharts items={mice} />
            <RealTimeBarChart items={mice} />
            <RealTimePieChart items={mice} />
        </div>
    );
}

export default AdminPanel;