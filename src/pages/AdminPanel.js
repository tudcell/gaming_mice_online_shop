import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/AdminPanel.css';
import useOfflineSupport from '../hooks/useOfflineSupport';

function AdminPanel() {
    const [mice, setMice] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
    const [editingId, setEditingId] = useState(null);
    const { isOnline, isServerUp, addPendingOperation } = useOfflineSupport();
    const isOfflineMode = !isOnline || !isServerUp;
    const isMounted = useRef(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        fetchMice();
    }, [isOfflineMode]);

    const fetchMice = async () => {
        if (!isMounted.current) return;

        try {
            setLoading(true);

            if (isOfflineMode) {
                const storedMice = JSON.parse(localStorage.getItem('cachedMice') || '[]');
                if (isMounted.current) setMice(storedMice);
                return;
            }

            const response = await axios.get('http://localhost:5002/api/mice');
            if (isMounted.current) {
                setMice(response.data);
                localStorage.setItem('cachedMice', JSON.stringify(response.data));
            }
        } catch (error) {
            console.error('Error fetching mice:', error);
            const storedMice = JSON.parse(localStorage.getItem('cachedMice') || '[]');
            if (isMounted.current) setMice(storedMice);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const mouseData = { ...formData, price: parseFloat(formData.price) || 0 };

        try {
            setLoading(true);

            if (isOfflineMode) {
                if (editingId) {
                    addPendingOperation('UPDATE_MOUSE', { id: editingId, ...mouseData });
                    setMice(prevMice => prevMice.map(mouse =>
                        mouse.id === editingId ? { ...mouse, ...mouseData } : mouse
                    ));
                } else {
                    const tempId = `temp_${Date.now()}`;
                    const newMouse = { id: tempId, ...mouseData };
                    addPendingOperation('ADD_MOUSE', newMouse);
                    setMice(prevMice => [...prevMice, newMouse]);
                }
            } else {
                if (editingId) {
                    await axios.patch(`http://localhost:5002/api/mice/${editingId}`, mouseData);
                } else {
                    await axios.post('http://localhost:5002/api/mice', mouseData);
                }
                fetchMice();
            }

            setEditingId(null);
            setFormData({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
        } catch (error) {
            console.error('Error saving mouse:', error);
            alert(error.response?.data?.message || 'Error saving mouse');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this mouse?')) {
            try {
                setLoading(true);

                if (isOfflineMode) {
                    addPendingOperation('DELETE_MOUSE', { id });
                    setMice(prevMice => prevMice.filter(mouse => mouse.id !== id));
                } else {
                    await axios.delete(`http://localhost:5002/api/mice/${id}`);
                    fetchMice();
                }
            } catch (error) {
                console.error('Error deleting mouse:', error);
                alert(error.response?.data?.message || 'Error deleting mouse');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEdit = (mouse) => {
        setEditingId(mouse.id);
        setFormData({
            name: mouse.name || '',
            price: (mouse.price !== undefined ? mouse.price.toString() : ''),
            details: mouse.details || '',
            image: mouse.image || '/assets/viperv3pro.avif'
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
    };

    return (
        <div className="admin-panel">
            {isOfflineMode && (
                <div className="offline-alert">
                    <p>Currently working in offline mode. Changes will sync when connection is restored.</p>
                </div>
            )}

            <h2>{editingId ? 'Edit Mouse' : 'Add New Mouse'}</h2>
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
                    <button type="submit" disabled={loading}>{editingId ? 'Update Mouse' : 'Add Mouse'}</button>
                    {editingId && <button type="button" onClick={cancelEdit} disabled={loading}>Cancel</button>}
                </div>
            </form>

            <h2>Mouse Inventory</h2>
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
                    {mice.length > 0 ? mice.map(mouse => (
                        <tr key={mouse.id || `mouse-${Math.random()}`}>
                            <td>{mouse.id || 'N/A'}</td>
                            <td>{mouse.name || 'Unnamed'}</td>
                            <td>${(mouse.price || 0).toFixed(2)}</td>
                            <td>
                                <button onClick={() => handleEdit(mouse)} disabled={loading}>Edit</button>
                                <button onClick={() => handleDelete(mouse.id)} disabled={loading}>Delete</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" className="no-data">No mice available</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminPanel;