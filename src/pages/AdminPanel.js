// File: src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RealTimeCharts from '../components/RealTimeCharts';
import RealTimeBarChart from '../components/RealTimeBarChart';
import RealTimePieChart from '../components/RealTimePieChart';
import '../styles/AdminPanel.css';

function AdminPanel() {
    const [mice, setMice] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [offlineQueue, setOfflineQueue] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMice();
        const storedQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
        setOfflineQueue(storedQueue);

        const socket = new WebSocket('ws://localhost:5002');
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'NEW_MOUSE':
                    setMice(prev => [...prev, message.data]);
                    break;
                case 'UPDATED_MOUSE':
                    setMice(prev => prev.map(mouse => mouse.id === message.data.id ? message.data : mouse));
                    break;
                case 'DELETED_MOUSE':
                    setMice(prev => prev.filter(mouse => mouse.id !== message.data.id));
                    break;
                case 'INITIAL_DATA':
                    setMice(message.data);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        };
        return () => { socket.close(); };
    }, []);

    const fetchMice = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5002/api/mice');
            setMice(response.data);
        } catch (error) {
            console.error('Error fetching mice:', error);
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

    // Modified: Upload file without changing the image field.
    const handleFileUpload = async () => {
        if (!selectedFile) return;
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        try {
            setUploading(true);
            const response = await axios.post('http://localhost:5002/api/upload', fileData, {
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
                    await axios.patch(`http://localhost:5002/api/mice/${editingId}`, mouseData);
                    setMice(prev => prev.map(mouse => mouse.id === editingId ? { ...mouse, ...mouseData } : mouse));
                } else {
                    const response = await axios.post('http://localhost:5002/api/mice', mouseData);
                    setMice(prev => [...prev, response.data]);
                }
            } else {
                if (editingId) {
                    const updatedQueue = offlineQueue.map(item =>
                        item.type === 'UPDATE' && item.data.id === editingId
                            ? { ...item, data: { ...item.data, ...mouseData } }
                            : item
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
                    setMice(prev => [...prev, newMouse]);
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
                    await axios.delete(`http://localhost:5002/api/mice/${id}`);
                } catch (error) {
                    console.error('Error deleting mouse:', error);
                }
            } else {
                const updatedQueue = [...offlineQueue, { type: 'DELETE', data: { id } }];
                setOfflineQueue(updatedQueue);
                localStorage.setItem('offlineQueue', JSON.stringify(updatedQueue));
                setMice(prev => prev.filter(mouse => mouse.id !== id));
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
                        await axios.delete(`http://localhost:5002/api/mice/${mouse.id}`);
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
                    await axios.post('http://localhost:5002/api/mice', change.data);
                } else if (change.type === 'UPDATE') {
                    await axios.patch(`http://localhost:5002/api/mice/${change.data.id}`, change.data);
                } else if (change.type === 'DELETE') {
                    await axios.delete(`http://localhost:5002/api/mice/${change.data.id}`);
                }
            } catch (error) {
                console.error('Error syncing offline changes:', error);
            }
        }
    };

    useEffect(() => {
        const handleOnline = () => { syncOfflineChanges(); };
        window.addEventListener('online', handleOnline);
        return () => { window.removeEventListener('online', handleOnline); };
    }, [offlineQueue]);

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

    return (
        <div className="admin-panel">
            <h1>Admin Panel</h1>
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
                    <button type="submit" disabled={loading}>{editingId ? 'Update Mouse' : 'Add Mouse'}</button>
                    {editingId && <button type="button" onClick={cancelEdit} disabled={loading}>Cancel</button>}
                </div>
            </form>

            <div className="delete-fake">
                <button onClick={handleDeleteFakeMice} disabled={loading}>
                    Delete All Fake Mice
                </button>
            </div>

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
                    {mice.length > 0 ? (
                        mice.map(mouse => (
                            <tr key={mouse.id}>
                                <td>{mouse.id}</td>
                                <td>{mouse.name}</td>
                                <td>${(parseFloat(mouse.price) || 0).toFixed(2)}</td>
                                <td>
                                    <button onClick={() => handleEdit(mouse)} disabled={loading}>Edit</button>
                                    <button onClick={() => handleDelete(mouse.id)} disabled={loading}>Delete</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="no-data">No mice available</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            )}

            <h2>Mouse Data Charts</h2>
            <RealTimeCharts items={mice} />
            <RealTimeBarChart items={mice} />
            <RealTimePieChart items={mice} />
        </div>
    );
}

export default AdminPanel;