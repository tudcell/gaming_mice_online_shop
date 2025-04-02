// src/components/AdminPanel.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminPanel.css'

function AdminPanel() {
    const [mice, setMice] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        details: '',
        image: '/assets/viperv3pro.avif' // Default image path
    });
    const [editingId, setEditingId] = useState(null);

    // Fetch all mice on component mount
    useEffect(() => {
        fetchMice();
    }, []);

    const fetchMice = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/mice');
            setMice(response.data);
        } catch (error) {
            console.error('Error fetching mice:', error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare data with proper price as number
        const mouseData = {
            ...formData,
            price: parseFloat(formData.price)
        };

        try {
            if (editingId) {
                // Update existing mouse
                await axios.put(`http://localhost:5000/api/mice/${editingId}`, mouseData);
                setEditingId(null);
            } else {
                // Add new mouse
                await axios.post('http://localhost:5000/api/mice', mouseData);
            }

            // Reset form and refresh mice list
            setFormData({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
            fetchMice();
        } catch (error) {
            console.error('Error saving mouse:', error);
            alert(error.response?.data?.message || 'Error saving mouse');
        }
    };

    const handleEdit = (mouse) => {
        setEditingId(mouse.id);
        setFormData({
            name: mouse.name,
            price: mouse.price.toString(),
            details: mouse.details,
            image: mouse.image
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this mouse?')) {
            try {
                await axios.delete(`http://localhost:5000/api/mice/${id}`);
                fetchMice();
            } catch (error) {
                console.error('Error deleting mouse:', error);
                alert(error.response?.data?.message || 'Error deleting mouse');
            }
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', price: '', details: '', image: '/assets/viperv3pro.avif' });
    };

    return (
        <div className="admin-panel">
            <h2>{editingId ? 'Edit Mouse' : 'Add New Mouse'}</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Price:</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0.01"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Details:</label>
                    <textarea
                        name="details"
                        value={formData.details}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Image Path:</label>
                    <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-buttons">
                    <button type="submit">{editingId ? 'Update Mouse' : 'Add Mouse'}</button>
                    {editingId && (
                        <button type="button" onClick={cancelEdit}>Cancel</button>
                    )}
                </div>
            </form>

            <h2>Mouse Inventory</h2>
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
                {mice.map(mouse => (
                    <tr key={mouse.id}>
                        <td>{mouse.id}</td>
                        <td>{mouse.name}</td>
                        <td>${mouse.price.toFixed(2)}</td>
                        <td>
                            <button onClick={() => handleEdit(mouse)}>Edit</button>
                            <button onClick={() => handleDelete(mouse.id)}>Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminPanel;